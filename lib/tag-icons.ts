import {
  IconTag,
  IconBriefcase,
  IconHome,
  IconCar,
  IconHeart,
  IconStar,
  IconBolt,
  IconShoppingCart,
  IconSchool,
  IconPlane,
  IconDeviceLaptop,
  IconCoffee,
} from "@tabler/icons-react";

export const TAG_ICONS = {
  tag: IconTag,
  briefcase: IconBriefcase,
  home: IconHome,
  car: IconCar,
  heart: IconHeart,
  star: IconStar,
  bolt: IconBolt,
  cart: IconShoppingCart,
  school: IconSchool,
  plane: IconPlane,
  laptop: IconDeviceLaptop,
  coffee: IconCoffee,
} as const;

export type TagIconKey = keyof typeof TAG_ICONS;

export const TAG_COLORS = [
  "#22D3EE",
  "#A3E635",
  "#F87171",
  "#FBBF24",
  "#A78BFA",
  "#FB923C",
  "#F472B6",
  "#60A5FA",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export function getTagIcon(key: string) {
  return TAG_ICONS[key as TagIconKey] ?? IconTag;
}
