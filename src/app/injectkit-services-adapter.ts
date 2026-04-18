import {
  createRegistry,
  getDefaultMetadataRegistry,
  type Container,
  type Registry,
  type Token,
} from "@janmbaco/injectkit";
import type { IServiceRegistry, ServiceToken } from "pick-components";

export class InjectKitServicesAdapter implements IServiceRegistry {
  private registry: Registry = createRegistry();
  private container: Container | null = null;

  buildContainer(): void {
    this.container ??= this.registry.build({ autoRegisterDecorated: true });
  }

  register<T>(token: ServiceToken<T>, instanceOrFactory: T | (() => T)): void {
    this.assertCanRegister(token);

    const injectToken = this.toInjectKitToken(token);
    if (this.registry.isRegistered(injectToken)) {
      this.registry.remove(injectToken);
    }

    if (this.isLazyFactory(instanceOrFactory)) {
      this.registry.registerFactory(
        injectToken,
        () => instanceOrFactory(),
        "singleton",
      );
      return;
    }

    this.registry.registerValue(injectToken, instanceOrFactory as T);
  }

  get<T>(token: ServiceToken<T>): T {
    return this.getBuiltContainer(token).get(this.toInjectKitToken(token));
  }

  has(token: ServiceToken): boolean {
    const injectToken = this.toInjectKitToken(token);
    return this.container
      ? this.container.hasRegistration(injectToken)
      : this.registry.isRegistered(injectToken) || this.isDecorated(injectToken);
  }

  clear(): void {
    this.registry = createRegistry();
    this.container = null;
  }

  private assertCanRegister(token: ServiceToken): void {
    if (!this.container) {
      return;
    }

    throw new Error(
      `[InjectKitServicesAdapter] Cannot register '${this.formatToken(
        token,
      )}' after the InjectKit container has been initialized.`,
    );
  }

  private getBuiltContainer(token: ServiceToken): Container {
    if (this.container) {
      return this.container;
    }

    throw new Error(
      `[InjectKitServicesAdapter] Cannot resolve '${this.formatToken(
        token,
      )}' before the InjectKit container has been initialized.`,
    );
  }

  private isLazyFactory<T>(value: T | (() => T)): value is () => T {
    return typeof value === "function" && !("prototype" in value);
  }

  private isDecorated(token: Token<unknown>): boolean {
    if (typeof token !== "function") {
      return false;
    }

    return (
      getDefaultMetadataRegistry().getServiceMetadata(token)?.injectable === true
    );
  }

  private toInjectKitToken<T>(token: ServiceToken<T>): Token<T> {
    return token as unknown as Token<T>;
  }

  private formatToken(token: ServiceToken): string {
    if (typeof token === "string") {
      return token;
    }

    if (typeof token === "symbol") {
      return token.description ? `Symbol(${token.description})` : token.toString();
    }

    return token.name || "<anonymous>";
  }
}
