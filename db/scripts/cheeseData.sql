DROP TABLE IF EXISTS cheeseURLS;
CREATE TABLE cheeseURLS
(
	id serial PRIMARY KEY,
	url VARCHAR( 255 ) UNIQUE NOT NULL
);

DROP TABLE IF EXISTS CheeseType;
CREATE TABLE CheeseType
(
	TypeId serial PRIMARY KEY,
	Name VARCHAR(255)
);

DROP TABLE IF EXISTS CheeseRegion;
CREATE TABLE CheeseRegion
(
	RegionId serial PRIMARY KEY,
	Name VARCHAR(255)
);

DROP TABLE IF EXISTS CheeseFlavor;
CREATE TABLE CheeseFlavor
(
	FlavorId serial PRIMARY KEY,
	Name VARCHAR(255)
);

DROP TABLE IF EXISTS CheeseAroma;
CREATE TABLE CheeseAroma
(
	AromaId serial PRIMARY KEY,
	Name VARCHAR(255)
);

DROP TABLE IF EXISTS CheeseData;
CREATE TABLE CheeseData
(
	CheeseId serial PRIMARY KEY,
	Name VARCHAR(100) UNIQUE,
	TypeId INTEGER,
	RegionId INTEGER,
	FOREIGN KEY (TypeId) REFERENCES CheeseType(TypeId),
	FOREIGN KEY (RegionId) REFERENCES CheeseRegion(RegionId)
);

DROP TABLE IF EXISTS FlavorLookup;
CREATE TABLE FlavorLookup
(
	CheeseId INTEGER,
	FlavorId INTEGER,
	FOREIGN KEY (CheeseId) REFERENCES CheeseData(CheeseId),
	FOREIGN KEY (FlavorId) REFERENCES CheeseFlavor(FlavorId)
);

DROP TABLE IF EXISTS AromaLookup;
CREATE TABLE AromaLookup
(
	CheeseId INTEGER,
	AromaId INTEGER,
	FOREIGN KEY (CheeseId) REFERENCES CheeseData(CheeseId),
	FOREIGN KEY (AromaId) REFERENCES CheeseAroma(AromaId)
);