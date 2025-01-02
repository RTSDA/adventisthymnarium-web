-- Export hymns
SELECT 'INSERT INTO hymns (number, title, content, hymnal_type) VALUES (' ||
       number || ', ' ||
       quote(title) || ', ' ||
       quote(content) || ', ' ||
       quote(hymnal_type) || ');'
FROM hymns;

-- Export thematic_lists
SELECT 'INSERT INTO thematic_lists (id, thematic, hymnal_type) VALUES (' ||
       id || ', ' ||
       quote(thematic) || ', ' ||
       quote(hymnal_type) || ');'
FROM thematic_lists;

-- Export thematic_ambits
SELECT 'INSERT INTO thematic_ambits (id, thematic_list_id, ambit, start_number, end_number) VALUES (' ||
       id || ', ' ||
       thematic_list_id || ', ' ||
       quote(ambit) || ', ' ||
       start_number || ', ' ||
       end_number || ');'
FROM thematic_ambits;

-- Export responsive_readings
SELECT 'INSERT INTO responsive_readings (number, title, content) VALUES (' ||
       number || ', ' ||
       quote(title) || ', ' ||
       quote(content) || ');'
FROM responsive_readings; 