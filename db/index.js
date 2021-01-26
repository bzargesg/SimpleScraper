const {Sequelize, Model, DataTypes} = require("sequelize");

const sequelize = new Sequelize("cheese", "cheesescript", "password", {
    host: "localhost",
    dialect: "postgres",
    define: {
        timestamps: false
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
const CheeseURL = sequelize.define("cheeseurls", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

const CheeseType = sequelize.define("cheeseType", {
    TypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

const CheeseRegion = sequelize.define("cheeseRegion", {
    RegionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});
const CheeseFlavor = sequelize.define("cheeseFlavor", {
    FlavorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

const CheeseAroma = sequelize.define("cheeseAroma", {
    AromaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});
const CheeseData = sequelize.define("cheeseData", {
    CheeseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    TypeId: {
        type: DataTypes.INTEGER,
        references: {
            model: CheeseType,
            key: "TypeId"
        }
    },
    RegionId: {
        type: DataTypes.INTEGER,
        references: {
            model: CheeseRegion,
            key: "RegionId"
        }
    }
});

const FlavorLookup = sequelize.define("FlavorLookup", {
    CheeseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: CheeseData,
            key: "CheeseId"
        }
    },
    FlavorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: CheeseFlavor,
            key: "FlavorId"
        }
    }
});
const AromaLookup = sequelize.define("AromaLookup", {
    CheeseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: CheeseData,
            key: "CheeseId"
        }
    },
    AromaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: CheeseAroma,
            key: "AromaId"
        }
    }
});

CheeseRegion.hasMany(CheeseData, {foreignKey: {name: "RegionId"}});
CheeseData.belongsTo(CheeseRegion);

CheeseType.hasMany(CheeseData, {foreignKey: {name: "TypeId"}});
CheeseData.belongsTo(CheeseType);

CheeseData.belongsToMany(CheeseFlavor, {through: FlavorLookup});
CheeseFlavor.belongsToMany(CheeseData, {through: FlavorLookup});

CheeseData.belongsToMany(CheeseAroma, {through: AromaLookup});
CheeseAroma.belongsToMany(CheeseData, {through: AromaLookup});

async function stuff() {
    try {
        await sequelize.authenticate();
        console.log("connection has been established successfully");
    } catch (error) {
        console.error("unable to connect to the database" + error);
    }
}

const selectAllUrls = async function () {
    return sequelize.query("SELECT * FROM cheeseurls");
};

stuff();

module.exports = {
    CheeseURL,
    selectAllUrls,
    CheeseData,
    CheeseAroma,
    CheeseFlavor,
    CheeseType,
    CheeseRegion
};
