import { LandingPage } from "@/components/landing/LandingPage";
import pkg from "../package.json";

export default function Home() {
  return <LandingPage version={pkg.version} />;
}
