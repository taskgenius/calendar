import { describe, it, expect } from "vitest";
import {
  BaseView,
  type ViewClass,
  type ViewMeta,
} from "../../../src/views/BaseView";
import { ViewRegistry } from "../../../src/views/ViewRegistry";

describe("ViewRegistry", () => {
  it("registers views, exposes metadata, and creates instances", () => {
    class AlphaView extends BaseView {
      static readonly meta: ViewMeta = {
        type: "alpha",
        label: "Alpha",
        order: 10,
      };

      render(container: HTMLElement): void {
        container.textContent = "alpha";
      }
    }

    class BetaView extends BaseView {
      static readonly meta: ViewMeta = {
        type: "beta",
        label: "Beta",
        order: 10,
      };

      render(container: HTMLElement): void {
        container.textContent = "beta";
      }
    }

    const registry = new ViewRegistry();

    // Register out of order to verify stable sorting
    registry.register(BetaView);
    registry.register(AlphaView);

    expect(registry.has("alpha")).toBe(true);
    expect(registry.size).toBe(2);

    const meta = registry.getMeta("alpha");
    expect(meta).toEqual(AlphaView.meta);
    expect(meta).not.toBe(AlphaView.meta); // meta is cloned when stored

    const instance = registry.create("alpha");
    expect(instance).toBeInstanceOf(AlphaView);

    // Sorted by order, then by type for stability
    expect(registry.getAll().map((m) => m.type)).toEqual(["alpha", "beta"]);
  });

  it("prevents duplicate registration unless override is requested", () => {
    class FirstView extends BaseView {
      static readonly meta: ViewMeta = {
        type: "duplicate",
        label: "Duplicate First",
      };

      render(): void {}
    }

    class SecondView extends BaseView {
      static readonly meta: ViewMeta = {
        type: "duplicate",
        label: "Duplicate Second",
      };

      render(): void {}
    }

    const registry = new ViewRegistry();

    registry.register(FirstView);
    expect(() => registry.register(SecondView)).toThrow(/already registered/);

    registry.register(SecondView, { override: true });
    const instance = registry.create("duplicate");
    expect(instance).toBeInstanceOf(SecondView);
    expect(registry.getMeta("duplicate")?.label).toBe("Duplicate Second");
  });

  it("validates view classes and meta at runtime", () => {
    const registry = new ViewRegistry();

    class MissingTypeView extends BaseView {
      // Intentionally invalid meta to exercise runtime validation
      static readonly meta = { label: "Missing type" } as unknown as ViewMeta;

      render(): void {}
    }

    expect(() => registry.register(MissingTypeView)).toThrow(/type/);

    class EmptyLabelView extends BaseView {
      static readonly meta = {
        type: "empty-label",
        label: "",
      } as ViewMeta;

      render(): void {}
    }

    expect(() => registry.register(EmptyLabelView)).toThrow(/label/);

    class NotAView {
      static readonly meta: ViewMeta = { type: "not-a-view", label: "Bad" };
    }

    // @ts-expect-error - intentionally passing a non-BaseView constructor
    expect(() => registry.register(NotAView)).toThrow(/extend BaseView/);
  });
});
