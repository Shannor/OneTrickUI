import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Destiny 2 One Trick App" },
    { name: "description", content: "Welcome to One Trick!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
