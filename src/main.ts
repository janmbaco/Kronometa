import { bootstrapFramework, Services } from "pick-components";

import { InjectKitServicesAdapter } from "./app/injectkit-services-adapter";
import { KronometaNavigationService } from "./features/routing/services/kronometa-navigation.service";
import "./styles.css";

const services = new InjectKitServicesAdapter();

Services.useImplementation(services);
Services.register("INavigationService", () => new KronometaNavigationService());
await import("./app/app-injectables");
await bootstrapFramework(Services, {}, { decorators: "auto" });
services.buildContainer();
await import("./app/register-components");
