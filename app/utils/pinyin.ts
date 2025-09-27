import { pinyin } from "pinyin-pro";

export function getPinyin(text: string): string {
  return pinyin(text, {
    toneType: "none",
    separator: "-",
    nonZh: "consecutive",
    v: true,
  });
}
