import { getAdminSession, getStudioData, getDocumentation, getLiveSchema, getAppConfig } from "./actions";
import { StudioLoginForm, StudioMain } from "./StudioClient";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const authenticated = await getAdminSession();

  if (!authenticated) {
    return <StudioLoginForm />;
  }

  const [data, docs, liveSchema, appConfig] = await Promise.all([
    getStudioData(),
    getDocumentation(),
    getLiveSchema(),
    getAppConfig(),
  ]);
  return <StudioMain data={data} docs={docs} liveSchema={liveSchema} appConfig={appConfig} />;
}
