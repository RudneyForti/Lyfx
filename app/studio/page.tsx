import { getAdminSession, getStudioData, getDocumentation, getLiveSchema } from "./actions";
import { StudioLoginForm, StudioMain } from "./StudioClient";

export default async function StudioPage() {
  const authenticated = await getAdminSession();

  if (!authenticated) {
    return <StudioLoginForm />;
  }

  const [data, docs, liveSchema] = await Promise.all([
    getStudioData(),
    getDocumentation(),
    getLiveSchema(),
  ]);
  return <StudioMain data={data} docs={docs} liveSchema={liveSchema} />;
}
