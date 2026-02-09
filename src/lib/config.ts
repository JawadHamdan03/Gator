import fs from "fs";

type GatorConfig = {
  db: {
    url: string;
  };
};

export function readConfig(): GatorConfig {
  const raw = fs.readFileSync(".gatorconfig.json", "utf-8");
  return JSON.parse(raw);
}
