import { bootstrapFramework, Services } from "pick-components";

import { InjectKitServicesAdapter } from "./app/injectkit-services-adapter";
import "./styles.css";

const services = new InjectKitServicesAdapter();

Services.useImplementation(services);
await import("./app/app-injectables");
await bootstrapFramework(Services, {}, { decorators: "auto" });
services.buildContainer();
await import("./app/register-components");
