import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Calendar } from "../../src/core/Calendar";
import { BaseView, ViewRegistry, type ViewMeta } from "../../src/views";
import type { CalendarEvent } from "../../src/types";

describe("Custom view usage", () => {
  let container: HTMLDivElement;
  let calendar: Calendar | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-calendar";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (calendar) {
      calendar.destroy();
      calendar = null;
    }
    container.remove();
  });

  it("mounts and renders a custom view registered in the registry", () => {
    const renderSpy = vi.fn();
    const mountSpy = vi.fn();

    class CustomView extends BaseView {
      static readonly meta: ViewMeta = {
        type: "custom-view",
        label: "Custom View",
        order: 1,
      };

      onMount(): void {
        super.onMount();
        mountSpy();
      }

      render(
        containerEl: HTMLElement,
        events: CalendarEvent[],
      ): void {
        renderSpy(events);
        const marker = document.createElement("div");
        marker.className = "custom-view";
        marker.textContent = `custom-${events.length}`;
        containerEl.appendChild(marker);
      }
    }

    const registry = new ViewRegistry();
    registry.register(CustomView);

    calendar = new Calendar("#test-calendar", {
      viewRegistry: registry,
      registerBuiltInViews: false,
      view: { type: "custom-view" },
    });

    expect(calendar.getView()).toBe("custom-view");
    expect(calendar.getActiveView()).toBeInstanceOf(CustomView);
    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".custom-view")).toBeTruthy();
  });

  it("calls lifecycle hooks when switching away from a custom view", () => {
    const unmountSpy = vi.fn();

    class SwitchableView extends BaseView {
      static readonly meta: ViewMeta = {
        type: "switchable",
        label: "Switchable",
      };

      onUnmount(): void {
        super.onUnmount();
        unmountSpy();
      }

      render(containerEl: HTMLElement): void {
        containerEl.textContent = "switchable";
      }
    }

    const registry = new ViewRegistry();
    registry.register(SwitchableView);

    calendar = new Calendar("#test-calendar", {
      viewRegistry: registry,
      view: { type: "switchable" },
    });

    expect(calendar.getActiveView()).toBeInstanceOf(SwitchableView);

    calendar.setView("month");

    expect(unmountSpy).toHaveBeenCalled();
    expect(calendar.getView()).toBe("month");
  });
});
