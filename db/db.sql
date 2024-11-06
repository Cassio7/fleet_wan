CREATE TABLE "vehicle" (
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
  "deviceId" int
);

CREATE TABLE "device" (
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

CREATE TABLE "group" (
  "id" int PRIMARY KEY,
  "vgId" int,
  "name" string
);

CREATE TABLE "vehicle_group" (
  "id" int PRIMARY KEY,
  "groupId" int,
  "vehicleId" int
);

CREATE TABLE "realtime_position" (
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

CREATE TABLE "tag" (
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

ALTER TABLE "vehicle" ADD FOREIGN KEY ("deviceId") REFERENCES "device" ("id");

ALTER TABLE "vehicle_group" ADD FOREIGN KEY ("groupId") REFERENCES "group" ("id");

ALTER TABLE "vehicle_group" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicle" ("id");

ALTER TABLE "realtime_position" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicle" ("id");

ALTER TABLE "history" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicle" ("id");

ALTER TABLE "history" ADD FOREIGN KEY ("sessionId") REFERENCES "session" ("id");

ALTER TABLE "tag_history" ADD FOREIGN KEY ("vehicleId") REFERENCES "vehicle" ("id");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tagId") REFERENCES "tag" ("id");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tagHistoryId") REFERENCES "tag_history" ("id");
