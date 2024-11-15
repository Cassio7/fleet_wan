CREATE TABLE "roles" (
  "id" int PRIMARY KEY,
  "name" string,
  "description" text
);

CREATE TABLE "users" (
  "id" int PRIMARY KEY,
  "name" string,
  "email" string,
  "password" string
);

CREATE TABLE "user_roles" (
  "id" int PRIMARY KEY,
  "userId" int,
  "roleId" int
);

CREATE TABLE "companies" (
  "id" int PRIMARY KEY,
  "suId" int,
  "name" string
);

CREATE TABLE "role_companies" (
  "id" int PRIMARY KEY,
  "companyId" int,
  "roleId" int
);

CREATE TABLE "groups" (
  "id" int PRIMARY KEY,
  "vgId" int,
  "name" string,
  "companyId" it
);

CREATE TABLE "vehicles" (
  "id" int PRIMARY KEY,
  "veId" int,
  "active" boolean,
  "plate" string,
  "model" string,
  "firstEvent" datetime,
  "lastEvent" datetime,
  "lastSessionEvent" datetime,
  "isCan" boolean,
  "isRFIDReader" boolean,
  "profileId" int,
  "profileName" string,
  "hash" string,
  "deviceId" int,
  "worksiteId" int
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
  "name" string
);

CREATE TABLE "vehicle_group" (
  "id" int PRIMARY KEY,
  "groupId" int,
  "worksiteId" int
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

ALTER TABLE "user_roles" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "user_roles" ADD FOREIGN KEY ("roleId") REFERENCES "roles" ("id");

ALTER TABLE "role_companies" ADD FOREIGN KEY ("companyId") REFERENCES "companies" ("id");

ALTER TABLE "role_companies" ADD FOREIGN KEY ("roleId") REFERENCES "user_roles" ("id");

ALTER TABLE "groups" ADD FOREIGN KEY ("companyId") REFERENCES "companies" ("id");

ALTER TABLE "vehicles" ADD FOREIGN KEY ("deviceId") REFERENCES "devices" ("id");

ALTER TABLE "vehicles" ADD FOREIGN KEY ("worksiteId") REFERENCES "worksite" ("id");

ALTER TABLE "notes" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "notes" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "vehicle_group" ADD FOREIGN KEY ("groupId") REFERENCES "groups" ("id");

ALTER TABLE "vehicle_group" ADD FOREIGN KEY ("worksiteId") REFERENCES "worksite" ("id");

ALTER TABLE "realtime_positions" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "history" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "history" ADD FOREIGN KEY ("sessionId") REFERENCES "session" ("id");

ALTER TABLE "tag_history" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tagId") REFERENCES "tags" ("id");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tagHistoryId") REFERENCES "tag_history" ("id");
