DROP TABLE IF EXISTS hymns;
DROP TABLE IF EXISTS thematic_lists;
DROP TABLE IF EXISTS thematic_ambits;
DROP TABLE IF EXISTS responsive_readings;

CREATE TABLE hymns (
    number INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    hymnal_type TEXT NOT NULL,
    PRIMARY KEY (number, hymnal_type)
);

CREATE TABLE thematic_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thematic TEXT NOT NULL,
    hymnal_type TEXT NOT NULL
);

CREATE TABLE thematic_ambits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thematic_list_id INTEGER,
    ambit TEXT NOT NULL,
    start_number INTEGER NOT NULL,
    end_number INTEGER NOT NULL,
    FOREIGN KEY (thematic_list_id) REFERENCES thematic_lists(id)
);

CREATE TABLE responsive_readings (
    number INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL
);

CREATE INDEX idx_hymns_hymnal_type ON hymns(hymnal_type);
CREATE INDEX idx_thematic_lists_hymnal_type ON thematic_lists(hymnal_type); 