import fs from "fs";
import MainLang from "./lang/en.json" assert { type: "json" };
import { Configuration, OpenAIApi } from "openai";
import { config } from "dotenv";
config();

const basePath = process.cwd();
const langDir = `${basePath}/lang`;
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const requiredLang = [
  {
    key: "zh",
    label: "chinese",
    rules: [
      "don't translate 'Mantle Network' ",
      "in chinese, translate dApps as 去中心化应用",
    ],
  },
  {
    key: "ja",
    label: "japanese",
    rules: [],
  },
  {
    key: "ko",
    label: "korea",
    rules: [],
  },
  {
    key: "ru",
    label: "russian",
    rules: [],
  },
];
const globalRules = ["don't translate the key, only value."];
let origin = MainLang;

const generateLang = async () => {
  // can't use promise all, chatgpt 429 error, too many request
  try {
    const translators = requiredLang.map((lang) => {
      let asking = `translate this JSON ${JSON.stringify(origin)} to ${
        lang.label
      }. Rules: ${globalRules.join()}, ${lang.rules.join()}`;

      return async () => {
        const translateResult = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: asking }],
        });
        let result = translateResult.data.choices[0].message?.content;
        fs.writeFileSync(`${langDir}/${lang.key}.json`, result);
        console.log(`${lang.label} done.`);
      };
    });

    console.log("translating...");

    translators
      .reduce((previousPromise, currentPromise) => {
        return previousPromise.then(() => currentPromise());
      }, Promise.resolve())
      .then(() => {
        console.log("All translation executed successfully.");
      })
      .catch((error) => {
        console.error("An error occurred:", error);
      });
  } catch (err) {
    console.log(err);
  }
};

generateLang();
