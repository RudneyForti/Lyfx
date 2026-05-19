import { getAdminSession, getStudioData, getDocumentation } from "./actions";
import { StudioLoginForm, StudioMain } from "./StudioClient";

export default async function StudioPage() {
  const authenticated = await getAdminSession();

  if (!authenticated) {
    return <StudioLoginForm />;
  }

  const [data, docs] = await Promise.all([getStudioData(), getDocumentation()]);
  return <StudioMain data={data} docs={docs} />;
}
