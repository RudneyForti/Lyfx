import { getProjections } from "@/app/actions/projections";
import { ProjectionsView } from "@/components/projections/ProjectionsView";

export default async function ProjectionsPage() {
  const projections = await getProjections();
  return <ProjectionsView projections={projections} />;
}
