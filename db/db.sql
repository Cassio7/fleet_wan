CREATE TABLE "roles" (
  "id" int PRIMARY KEY,
  "name" string,
  "description" text
);

CREATE TABLE "users" (
  "id" int PRIMARY KEY,
  "name" string,
  "surname" string,
  "username" string,
  "email" string,
  "password" string,
  "roleId" int
);

CREATE TABLE "associations" (
  "id" int PRIMARY KEY,
  "userId" int,
  "companyId" int,
  "worksiteId" int
);

CREATE TABLE "companies" (
  "id" int PRIMARY KEY,
  "suId" int,
  "name" string
);

CREATE TABLE "groups" (
  "id" int PRIMARY KEY,
  "vgId" int,
  "name" string,
  "worksiteId" int,
  "companyId" it
);

CREATE TABLE "vehicles" (
  "id" int PRIMARY KEY,
  "veId" int,
  "active" boolean,
  "active_csv" boolean,
  "plate" string,
  "model" string,
  "model_csv" string,
  "registration" string,
  "euro" string,
  "firstEvent" datetime,
  "lastEvent" datetime,
  "lastSessionEvent" datetime,
  "isCan" boolean,
  "fleet_number" string,
  "fleet_install" string,
  "electrical" boolean,
  "isRFIDReader" boolean,
  "allestimento" boolean,
  "antenna_setting" string,
  "fleet_antenna_number" string,
  "profileId" int,
  "profileName" string,
  "retired_event" date,
  "worksite_priority" number,
  "hash" string,
  "deviceId" int,
  "worksiteId" int
);

CREATE TABLE "services" (
  "id" int PRIMARY KEY,
  "name" string,
  "vehicleId" int
);

CREATE TABLE "workzone" (
  "id" int PRIMARY KEY,
  "name" string,
  "vehicleId" int
);

CREATE TABLE "rental" (
  "id" int PRIMARY KEY,
  "name" string,
  "vehicleId" int
);

CREATE TABLE "equipments" (
  "id" int PRIMARY KEY,
  "name" string,
  "vehicleId" int
);

CREATE TABLE "notes" (
  "id" int PRIMARY KEY,
  "text" text,
  "userId" int,
  "vehicleId" int
);

CREATE TABLE "devices" (
  "id" int PRIMARY KEY,
  "device_id" int,
  "type" int,
  "serial_number" string,
  "date_build" date,
  "fw_upgrade_disable" boolean,
  "fw_id" int,
  "fw_update" datetime,
  "fw_upgrade_received" int,
  "rtc_battery_fail" boolean,
  "power_fail_detected" int,
  "power_on_off_detected" int,
  "hash" string
);

CREATE TABLE "worksite" (
  "id" int PRIMARY KEY,
  "name" string,
  "groupId" int
);

CREATE TABLE "realtime_positions" (
  "id" int PRIMARY KEY,
  "row_number" int,
  "timestamp" timestamp,
  "status" int,
  "latitude" double,
  "longitude" double,
  "nav_mode" int,
  "speed" int,
  "direction" int,
  "hash" string,
  "vehicleId" int
);

CREATE TABLE "history" (
  "id" int PRIMARY KEY,
  "timestamp" timestamp,
  "status" int,
  "latitude" double,
  "longitude" double,
  "nav_mode" int,
  "speed" int,
  "direction" int,
  "tot_distance" double,
  "tot_consumption" double,
  "fuel" float,
  "brushes" int,
  "hash" string,
  "vehicleId" int,
  "sessionId" int
);

CREATE TABLE "tags" (
  "id" int PRIMARY KEY,
  "epc" string
);

CREATE TABLE "tag_history" (
  "id" int PRIMARY KEY,
  "timestamp" timestamp,
  "latitude" double,
  "longitude" double,
  "nav_mode" int,
  "geozone" string,
  "hash" string,
  "vehicleId" int
);

CREATE TABLE "detection_tag" (
  "id" int PRIMARY KEY,
  "tid" string,
  "detection_quality" float,
  "tagId" string,
  "tagHistoryId" int
);

CREATE TABLE "session" (
  "id" int PRIMARY KEY,
  "period_from" date,
  "period_to" date,
  "sequence_id" int,
  "closed" boolean,
  "distance" int,
  "engine_drive" int,
  "engine_stop" int,
  "hash" string
);

CREATE TABLE "anomaly" (
  "id" int PRIMARY KEY,
  "date" date,
  "gps" string,
  "antenna" string,
  "session" string,
  "hash" string,
  "vehicleId" int
);

ALTER TABLE "users" ADD FOREIGN KEY ("roleId") REFERENCES "roles" ("id");

ALTER TABLE "associations" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "associations" ADD FOREIGN KEY ("companyId") REFERENCES "companies" ("id");

ALTER TABLE "associations" ADD FOREIGN KEY ("worksiteId") REFERENCES "worksite" ("id");

ALTER TABLE "groups" ADD FOREIGN KEY ("worksiteId") REFERENCES "worksite" ("id");

ALTER TABLE "groups" ADD FOREIGN KEY ("companyId") REFERENCES "companies" ("id");

ALTER TABLE "vehicles" ADD FOREIGN KEY ("deviceId") REFERENCES "devices" ("id");

ALTER TABLE "vehicles" ADD FOREIGN KEY ("worksiteId") REFERENCES "worksite" ("id");

ALTER TABLE "services" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "workzone" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "rental" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "equipments" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "notes" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "notes" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "worksite" ADD FOREIGN KEY ("groupId") REFERENCES "groups" ("id");

ALTER TABLE "realtime_positions" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "history" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "history" ADD FOREIGN KEY ("sessionId") REFERENCES "session" ("id");

ALTER TABLE "tag_history" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tagId") REFERENCES "tags" ("id");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tagHistoryId") REFERENCES "tag_history" ("id");

ALTER TABLE "anomaly" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");
