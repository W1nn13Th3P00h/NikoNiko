-- identifiant is now the admin URL slug for an athlete (/admin/athletes/[identifiant]),
-- not just an optional login credential — every athlete needs one.
alter table athlete
  alter column identifiant set not null;
