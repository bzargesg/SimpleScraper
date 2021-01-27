const fetch = require("node-fetch");
const jsdom = require("jsdom");
const {
    CheeseURL,
    selectAllUrls,
    CheeseData,
    CheeseAroma,
    CheeseFlavor,
    CheeseType,
    CheeseRegion,
    sequelize
} = require("./db");
const {promises} = require("fs");

var letterCount = 0;
const letters = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z"
];

//functions for parsing based on first 4 letters of data from cheese website
//trim off superfolous data save it and apply it to the cheese data for many to many or many to one simplicity
const lookupObj = {
    Type: (input, cheeseData, t) => {
        var string = input.substring(5).trim();
        return string.split(",").map(async (cheeseType) => {
            return CheeseType.findOrCreate({
                where: {name: cheeseType.trim()},
                transaction: t
            }).then((type) => {
                cheeseData.addCheesetype(type[0]);
            });
        });
    },
    Coun: (input, cheeseData, t) => {
        return [
            CheeseRegion.findOrCreate({
                where: {name: input.substring(18).trim()},
                transaction: t
            }).then((region) => {
                cheeseData.setCheeseregion(region[0]);
            })
        ];
    },
    Flav: (input, cheeseData, t) => {
        var string = input.substring(8).trim();
        return string.split(",").map(async (cheeseFlavor) => {
            return CheeseFlavor.findOrCreate({
                where: {name: cheeseFlavor.trim()},
                transaction: t
            }).then((flavor) => {
                cheeseData.addCheeseflavor(flavor[0]);
            });
        });
    },
    Arom: (input, cheeseData, t) => {
        var string = input.substring(6).trim();
        return string.split(",").map(async (cheeseAroma) => {
            return CheeseAroma.findOrCreate({
                where: {name: cheeseAroma.trim()},
                transaction: t
            }).then((aroma) => {
                cheeseData.addCheesearoma(aroma[0]);
            });
        });
    }
};

//website just returns the last page if you are over the last page number
//just hammer and go through page 1-10 (nothing over page 10)
async function searchCheeseURLs() {
    letters.forEach(async (letter) => {
        for (let i = 1; i <= 10; i++) {
            if (letter !== undefined) {
                await fetch(
                    `https://cheese.com/alphabetical/?per_page=100&i=${letter}&page=${i}#top`
                )
                    .then((response) => {
                        console.log(
                            `SENT GET to https://cheese.com/alphabetical/?per_page=100&i=${letter}&page=${i}#top`
                        );
                        return response.text();
                    })
                    .then((body) => {
                        //parse the response into DOM elements to easily nab cheese names
                        var doc = new jsdom.JSDOM(body);
                        doc.window.document.querySelectorAll(".cheese-item").forEach((element) => {
                            const cheeseModel = CheeseURL.build({
                                url: "https://www.cheese.com" + element.querySelector("a").href
                            });
                            cheeseModel.save().catch((err) => {
                                //catch duplicates here and keep moving on
                                console.log(`Letter:${letter} page ${i}`);
                            });
                        });
                    });
            }
        }
    });
}

(async function getAll() {
    //Naive approach - should really stream these values
    //select all returns the full array of cheese urls
    await selectAllUrls().then(async (results) => {
        //results[1] is query metadata - we care about results[0]
        results[0].forEach(async (url) => {
            //get cheese name from the url
            var cheeseName = url.url.substring(23, url.url.length - 1);
            const t = await sequelize.transaction();
            const cheeseData = await CheeseData.findOrCreate({
                where: {name: cheeseName},
                transaction: t
            });
            // console.log("name: " + cheeseName);
            //if created the cheese entry
            if (cheeseData[1]) {
                await fetch(url.url)
                    .then((response) => {
                        return response.text();
                    })
                    .then(async (html) => {
                        var doc = new jsdom.JSDOM(html);
                        //class summary-points contains all the metadata i want
                        var savePromises = [];
                        doc.window.document.querySelectorAll(".summary-points").forEach((node) => {
                            return node.querySelectorAll("li").forEach(async (liNode) => {
                                var parseString = liNode.querySelector("p").textContent;
                                if (lookupObj[parseString.substring(0, 4)]) {
                                    //can use the first 4 letters to figure out what the data is(region, type, etc...)
                                    var lookupReturn = lookupObj[parseString.substring(0, 4)](
                                        parseString,
                                        cheeseData[0],
                                        t
                                    );
                                    savePromises = savePromises.concat([...lookupReturn]);
                                }
                            });
                        });
                        Promise.all(savePromises)
                            .then((values) => t.commit())
                            .catch((err) => t.rollback());
                    })
                    .catch(async (error) => {
                        await t.rollback();
                    });
            }
        });
    });
})();

// console.log(hi);
// (async function testStuff() {
//     var stuff = await CheeseData.findOne({where: {name: "graviera"}});
//     console.log(stuff);
// })();
