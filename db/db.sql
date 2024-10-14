CREATE TABLE "vehicle" (
  "veId" int PRIMARY KEY,
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
  "deviceId" int,
  "hash" string
);

CREATE TABLE "device" (
  "id" int PRIMARY KEY,
  "type" int,
  "serial_number" string,
  "date_build" date,
  "fw_upgrade_disable" boolean,
  "fw_id" int,
  "fw_update" datetime,
  "fw_upgrade_received" int,
  "rtc_battery_fail" boolean,
  "power_fail_detected" int,
  "power_on_off_detected" int
);

CREATE TABLE "group" (
  "vgId" int PRIMARY KEY,
  "name" string
);

CREATE TABLE "vehicle_group" (
  "vg_id" int,
  "ve_id" int,
  "primary_group" boolean,
  "primary" key(vg_id,ve_id)
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
  "veId" int
);

CREATE TABLE "history" (
  "id" int PRIMARY KEY,
  "date_from" date,
  "date_to" date,
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
  "veId" int
);

CREATE TABLE "tag" (
  "epc" string PRIMARY KEY
);

CREATE TABLE "tag_history" (
  "id" int PRIMARY KEY,
  "timestamp" timestamp,
  "latitude" double,
  "longitude" double,
  "nav_mode" int,
  "geozone" string,
  "veId" int
);

CREATE TABLE "detection_tag" (
  "id" int PRIMARY KEY,
  "tid" string,
  "detection_quality" float,
  "epc" string,
  "tag_history_id" int
);

ALTER TABLE "vehicle" ADD FOREIGN KEY ("deviceId") REFERENCES "device" ("id");

ALTER TABLE "vehicle_group" ADD FOREIGN KEY ("vg_id") REFERENCES "group" ("vgId");

ALTER TABLE "vehicle_group" ADD FOREIGN KEY ("ve_id") REFERENCES "vehicle" ("veId");

ALTER TABLE "realtime_position" ADD FOREIGN KEY ("veId") REFERENCES "vehicle" ("veId");

ALTER TABLE "history" ADD FOREIGN KEY ("veId") REFERENCES "vehicle" ("veId");

ALTER TABLE "tag_history" ADD FOREIGN KEY ("veId") REFERENCES "vehicle" ("veId");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("epc") REFERENCES "tag" ("epc");

ALTER TABLE "detection_tag" ADD FOREIGN KEY ("tag_history_id") REFERENCES "tag_history" ("id");
