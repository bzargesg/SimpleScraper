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
// 'Made from pasteurized cow's milk'
// 'Country of origin: United States'
// 'Family: Mozzarella'
// 'Type: soft, artisan'
// 'Texture: buttery and creamy'
// 'Rind: rindless'
// 'Colour: white'
// 'Flavour: buttery, herbaceous, lemony, mild, milky'
// 'Aroma: aromatic, herbal'
// 'Vegetarian: yes '
// 'Producers: Fiore di Nonno'
// 'Alternative spellings: Zaatar'
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
        // return ["CheeseRegion", {Name: input.substring(18).trim()}];
    }, //CheeseRegion
    Flav: async (input, cheeseData) => {
        var string = input.substring(8).trim();
        string.split(",").map(async (cheeseFlavor) => {
            const flavor = await CheeseFlavor.findOrCreate({where: {name: cheeseFlavor.trim()}});
            await cheeseData.addCheeseflavor(flavor[0]);
        });
    }, //CheeseFlavor
    Arom: async (input, cheeseData) => {
        var string = input.substring(6).trim();
        string.split(",").map(async (cheeseAroma) => {
            const aroma = await CheeseAroma.findOrCreate({where: {name: cheeseAroma.trim()}});
            await cheeseData.addCheesearoma(aroma[0]);
        });
    } //CheeseAroma
};

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
                        var doc = new jsdom.JSDOM(body);
                        doc.window.document.querySelectorAll(".cheese-item").forEach((element) => {
                            const cheeseModel = CheeseURL.build({
                                url: "https://www.cheese.com" + element.querySelector("a").href
                            });
                            cheeseModel.save().catch((err) => {
                                console.log(`Letter:${letter} page ${i}`);
                            });
                        });
                    });
            }
        }
    });
}

// searchCheeseURLs();
(async function getAll() {
    //Naive approach - should really stream these values
    await selectAllUrls().then(async (results) => {
        for (let i = 0; i < 2; i++) {
            var cheeseName = results[0][i].url.substring(23, results[0][i].url.length - 1);
            const cheeseData = await CheeseData.findOrCreate({where: {name: cheeseName}});
            console.log("name: " + cheeseName);
            await fetch(results[0][i].url)
                .then((response) => {
                    return response.text();
                })
                .then((html) => {
                    var doc = new jsdom.JSDOM(html);
                    var summary = doc.window.document
                        .querySelectorAll(".summary-points")
                        .forEach((node) => {
                            console.log(node);
                            //doc.window.document.querySelectorAll(".summary-points")[0].querySelectorAll("li")[4].querySelector('p').textContent
                            node.querySelectorAll("li").forEach(async (liNode) => {
                                var parseString = liNode.querySelector("p").textContent;
                                if (lookupObj[parseString.substring(0, 4)]) {
                                    var parsedValue = await lookupObj[parseString.substring(0, 4)](
                                        parseString,
                                        cheeseData[0]
                                    );
                                    // cheeseData[parsedValue[0]] = parsedValue[1];
                                }
                            });
                            // console.log(cheeseData);
                            // CheeseData.build(cheeseData).save();
                        });
                });
        }
    });
})();
