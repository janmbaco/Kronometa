import { bootstrapFramework, Services } from "pick-components";

import { InjectKitServicesAdapter } from "./app/injectkit-services-adapter";
import "./styles.css";

Services.useImplementation(new InjectKitServicesAdapter());

await import("./app/app-injectables");
await bootstrapFramework(Services, {}, { decorators: "auto" });
await import("./app/register-components");
