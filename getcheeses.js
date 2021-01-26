const fetch = require("node-fetch");
const jsdom = require("jsdom");
const {
    CheeseURL,
    selectAllUrls,
    CheeseData,
    CheeseAroma,
    CheeseFlavor,
    CheeseType,
    CheeseRegion
} = require("./db");

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
    Type: async (input, cheeseData) => {
        var string = input.substring(5).trim();
        string.split(",").map(async (cheeseType) => {
            const type = await CheeseType.findOrCreate({where: {name: cheeseType.trim()}});
            await cheeseData.addCheesetype(type[0]);
        });
    },
    Coun: async (input, cheeseData) => {
        const region = await CheeseRegion.findOrCreate({where: {name: input.substring(18).trim()}});
        await cheeseData.setCheeseregion(region[0]);
    },
    Flav: async (input, cheeseData) => {
        var string = input.substring(8).trim();
        string.split(",").map(async (cheeseFlavor) => {
            const flavor = await CheeseFlavor.findOrCreate({where: {name: cheeseFlavor.trim()}});
            await cheeseData.addCheeseflavor(flavor[0]);
        });
    },
    Arom: async (input, cheeseData) => {
        var string = input.substring(6).trim();
        string.split(",").map(async (cheeseAroma) => {
            const aroma = await CheeseAroma.findOrCreate({where: {name: cheeseAroma.trim()}});
            await cheeseData.addCheesearoma(aroma[0]);
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
            const cheeseData = await CheeseData.findOrCreate({where: {name: cheeseName}});
            console.log("name: " + cheeseName);
            //if created the cheese entry
            if (cheeseData[1]) {
                //wait so we dont get blocked by cheese.com
                setTimeout(() => {}, 2000);
                await fetch(url.url)
                    .then((response) => {
                        return response.text();
                    })
                    .then((html) => {
                        var doc = new jsdom.JSDOM(html);
                        //class summary-points contains all the metadata i want
                        var summary = doc.window.document
                            .querySelectorAll(".summary-points")
                            .forEach((node) => {
                                node.querySelectorAll("li").forEach(async (liNode) => {
                                    var parseString = liNode.querySelector("p").textContent;
                                    if (lookupObj[parseString.substring(0, 4)]) {
                                        //can use the first 4 letters to figure out what the data is(region, type, etc...)
                                        var parsedValue = await lookupObj[
                                            parseString.substring(0, 4)
                                        ](parseString, cheeseData[0]);
                                    }
                                });
                            });
                    });
            }
        });
    });
})();
