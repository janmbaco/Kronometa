import { readFile } from "node:fs/promises";

import { expect, type Locator, type Page, test } from "@playwright/test";

test.describe("flujo guiado de cronometraje", () => {
  test.use({ viewport: { width: 1912, height: 1001 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/setup/mode");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/setup/mode");
    await expect(page.locator("kronometa-app")).toBeVisible();
    await expect(page).toHaveURL(/\/setup\/mode$/);
  });

  test("opera una carrera con salidas escalonadas y permite repetirla", async ({
    page,
  }) => {
    await chooseMode(page, "staggered_start");
    await addRunner(page, "1");
    await addRunner(page, "2");
    await prepareRace(page);

    const race = page.locator("race-view");
    await expect(page).toHaveURL(/\/race$/);
    await expect(race.locator(".next-runner")).toContainText("1");

    await race.getByRole("button", { name: "Dar salida al siguiente" }).click();
    await expect(race.locator("runner-row")).toHaveCount(1);
    await expect(rowStatus(race.locator("runner-row").nth(0))).toContainText(
      "En carrera",
    );
    await expect(rowElapsed(race.locator("runner-row").nth(0))).toHaveText(
      durationPattern,
    );
    await expect(
      race.locator("runner-row").nth(0).getByRole("button", { name: "Llegada" }),
    ).toBeEnabled();

    const pickForIds = await getRaceViewPickForIds(page);
    await page.waitForTimeout(350);
    expect(await getRaceViewPickForIds(page)).toEqual(pickForIds);

    await expect(race.locator(".next-runner")).toContainText("2");
    await race.getByRole("button", { name: "Dar salida al siguiente" }).click();
    await expect(race.locator("runner-row")).toHaveCount(2);

    await race.locator("runner-row").nth(0).getByRole("button", { name: "Llegada" }).click();
    await expect(rowStatus(race.locator("runner-row").nth(1))).toContainText(
      "Finalizado",
    );
    await race.locator("runner-row").nth(0).getByRole("button", { name: "Llegada" }).click();

    await expect(page).toHaveURL(/\/results$/);
    await expect(page.locator("results-panel tbody tr")).toHaveCount(2);
    await expect(page.locator("results-view .history-card")).toHaveCount(1);
    await expect(
      page
        .locator("results-view .history-card")
        .first()
        .locator(".history-table tbody tr"),
    ).toHaveCount(2);
    await expect(page.locator("results-view")).toContainText("1 carrera");

    await page.getByRole("button", { name: "Repetir misma carrera" }).click();
    await expect(page).toHaveURL(/\/race$/);
    await expect(page.locator("race-view .next-runner")).toContainText("1");
    await expect(page.locator("race-view")).toContainText("2 pendientes");

    await completeCurrentStaggeredRace(page);
    await expect(page).toHaveURL(/\/results$/);
    await expect(page.locator("results-view .history-card")).toHaveCount(2);
    await expect(
      page
        .locator("results-view .history-card")
        .first()
        .locator(".history-table tbody tr"),
    ).toHaveCount(2);
    await expect(page.locator("results-view")).toContainText("2 carreras");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV histórico" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(download.suggestedFilename()).toBe("kronometa-historico.csv");
    expect(downloadPath).not.toBeNull();
    const csv = await readFile(downloadPath as string, "utf8");
    const rows = csv.trim().split("\n");
    expect(rows[0]).toContain("race_id,timestamp,mode,total_runners");
    expect(rows).toHaveLength(5);
    expect(rows.filter((row) => row.includes("staggered_start"))).toHaveLength(4);
  });

  test("opera una salida masiva y muestra resultados", async ({ page }) => {
    await chooseMode(page, "mass_start");
    await addRunner(page, "1");
    await addRunner(page, "2");
    await prepareRace(page);

    const race = page.locator("race-view");
    await race.getByRole("button", { name: "Iniciar salida masiva" }).click();

    const rows = race.locator("runner-row");
    await expect(rows).toHaveCount(2);
    await expect(rowStatus(rows.nth(0))).toContainText("En carrera");
    await expect(rowElapsed(rows.nth(0))).toHaveText(durationPattern);
    await expect(rows.nth(0).getByRole("button", { name: "Llegada" })).toBeEnabled();

    await rows.nth(0).getByRole("button", { name: "Llegada" }).click();
    const finishedRow = rows.nth(0);
    await expect(rowStatus(finishedRow)).toContainText("Finalizado");
    await expect(finishedRow.locator("#manualTimeInput")).toHaveCount(0);
    await expect(
      finishedRow.getByRole("button", { name: "Editar tiempo" }),
    ).toBeVisible();

    await finishedRow.getByRole("button", { name: "Editar tiempo" }).click();
    const manualInput = finishedRow.locator("#manualTimeInput");
    const saveManualTime = finishedRow.getByRole("button", {
      name: "Guardar cambios",
    });
    await expect(manualInput).toBeVisible();
    await expect(saveManualTime).toBeDisabled();

    await manualInput.fill("99:99");
    await expect(saveManualTime).toBeDisabled();

    await manualInput.fill("00:09.500");
    await expect(saveManualTime).toBeEnabled();
    await finishedRow.getByRole("button", { name: "Cancelar" }).click();
    await expect(finishedRow.locator("#manualTimeInput")).toHaveCount(0);
    await expect(rowElapsed(finishedRow)).not.toHaveText("00:09.500");

    await finishedRow.getByRole("button", { name: "Editar tiempo" }).click();
    await finishedRow.locator("#manualTimeInput").fill("00:09.500");
    await finishedRow.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(finishedRow.locator("#manualTimeInput")).toHaveCount(0);
    await expect(rowElapsed(finishedRow)).toHaveText("00:09.500");

    await rows.nth(1).getByRole("button", { name: "Llegada" }).click();

    await expect(page).toHaveURL(/\/results$/);
    await expect(page.locator("results-panel tbody tr")).toHaveCount(2);
    await expect(page.locator("results-view .history-card")).toHaveCount(1);
    await expect(
      page
        .locator("results-view .history-card")
        .first()
        .locator(".history-table tbody tr"),
    ).toHaveCount(2);
    await expect(page.locator("results-view")).toContainText("1 carrera");
    await expect(
      page.getByRole("button", { name: "Exportar CSV histórico" }),
    ).toBeEnabled();
  });

  test("permite eliminar corredores antes de preparar la carrera", async ({
    page,
  }) => {
    await chooseMode(page, "mass_start");
    await addRunner(page, "1");
    await addRunner(page, "2");

    const setup = page.locator("runner-setup-view");
    await expect(setup.locator("runner-row")).toHaveCount(2);
    await setup
      .locator("runner-row")
      .first()
      .getByRole("button", { name: "Eliminar" })
      .click();

    await expect(setup.locator("runner-row")).toHaveCount(1);
    await expect(setup.locator("runner-row").first()).toContainText("Dorsal 2");

    await addRunner(page, "1");
    await expect(setup.locator("runner-row")).toHaveCount(2);
  });

  test("permite volver hacia atras desde el breadcrumb solo antes de iniciar", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Modo de salida", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Registro de corredores",
        exact: true,
      }),
    ).toHaveCount(0);

    await chooseMode(page, "mass_start");
    await expect(
      page.getByRole("button", {
        name: "Registro de corredores",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Carrera en curso", exact: true }),
    ).toHaveCount(0);

    await addRunner(page, "1");

    await page
      .getByRole("button", { name: "Modo de salida", exact: true })
      .click();
    await expect(page).toHaveURL(/\/setup\/mode$/);

    await page.getByRole("button", { name: "Continuar con corredores" }).click();
    await expect(page).toHaveURL(/\/setup\/runners$/);
    await prepareRace(page);
    await expect(
      page.getByRole("button", { name: "Carrera en curso", exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Modo de salida", exact: true })
      .click();
    await expect(page).toHaveURL(/\/setup\/mode$/);
    await page.getByRole("button", { name: "Continuar con corredores" }).click();
    await expect(page).toHaveURL(/\/setup\/runners$/);
    await prepareRace(page);

    await page
      .getByRole("button", { name: "Registro de corredores", exact: true })
      .click();
    await expect(page).toHaveURL(/\/setup\/runners$/);
    await prepareRace(page);

    await page.getByRole("button", { name: "Iniciar salida masiva" }).click();
    await expect(
      page.getByRole("button", { name: "Modo de salida", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Registro de corredores",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Carrera en curso", exact: true }),
    ).toBeDisabled();
  });

  test("borra todos los datos locales desde el historico", async ({ page }) => {
    await chooseMode(page, "mass_start");
    await addRunner(page, "1");
    await prepareRace(page);

    const race = page.locator("race-view");
    await race.getByRole("button", { name: "Iniciar salida masiva" }).click();
    await race
      .locator("runner-row")
      .first()
      .getByRole("button", { name: "Llegada" })
      .click();

    await expect(page).toHaveURL(/\/results$/);
    await expect(page.locator("results-view .history-card")).toHaveCount(1);
    await expect(
      page.evaluate(() => window.localStorage.length),
    ).resolves.toBeGreaterThan(0);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Borrar datos locales" }).click();

    await expect(page).toHaveURL(/\/setup\/mode$/);
    await expect(page.locator("results-view")).toHaveCount(0);
    await expect(page.evaluate(() => window.localStorage.length)).resolves.toBe(0);
  });
});

async function chooseMode(page: Page, mode: "mass_start" | "staggered_start") {
  await page.locator("#raceMode").selectOption(mode);
  await page.getByRole("button", { name: "Continuar con corredores" }).click();
  await expect(page).toHaveURL(/\/setup\/runners$/);
}

async function addRunner(page: Page, bib: string): Promise<void> {
  const form = page.locator("runner-form");
  await form.locator("#bibInput").fill(bib);
  await form.getByRole("button", { name: "Añadir corredor" }).click();
  await expect(form).toContainText("Corredor añadido.");
}

async function prepareRace(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Preparar salida" }).click();
  await expect(page).toHaveURL(/\/race$/);
}

async function completeCurrentStaggeredRace(page: Page): Promise<void> {
  const race = page.locator("race-view");

  await race.getByRole("button", { name: "Dar salida al siguiente" }).click();
  await race
    .locator("runner-row")
    .first()
    .getByRole("button", { name: "Llegada" })
    .click();
  await race.getByRole("button", { name: "Dar salida al siguiente" }).click();
  await race
    .locator("runner-row")
    .first()
    .getByRole("button", { name: "Llegada" })
    .click();
}

function rowStatus(row: Locator): Locator {
  return row.locator(".status-pill");
}

function rowElapsed(row: Locator): Locator {
  return row.locator(".time span");
}

async function getRaceViewPickForIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const appRoot = document.querySelector("kronometa-app")?.shadowRoot;
    const raceView = appRoot
      ?.querySelector("pick-router")
      ?.querySelector("race-view");
    const raceRoot = raceView?.shadowRoot;

    return Array.from(raceRoot?.querySelectorAll("pick-for") ?? []).map(
      (pickFor) => pickFor.getAttribute("items") ?? "",
    );
  });
}

const durationPattern = /^\d{2}:\d{2}\.\d{3}$/;
