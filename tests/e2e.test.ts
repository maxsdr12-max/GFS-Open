import { test, expect } from '@playwright/test';

test.describe('GFS Presentation Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set a dummy API key to prevent auto-opening settings dialog
    await page.evaluate(() => {
      localStorage.setItem('gfs-studio:openrouter:api-key', 'sk-or-v1-test-key');
      localStorage.setItem('gfs-studio:openrouter:settings', JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        temperature: 0.4,
        rememberKey: true
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should load the main page', async ({ page }) => {
    await expect(page.locator('#stage')).toBeVisible();
    // Check for at least one visible slide (the first one)
    await expect(page.locator('.slide').first()).toBeVisible();
  });

  test('should have assistant panel', async ({ page }) => {
    const assistantToggle = page.locator('#assistant-toggle');
    await expect(assistantToggle).toBeVisible();
    
    // Open assistant panel
    await assistantToggle.click();
    await expect(page.locator('#assistant-panel')).not.toBeHidden();
  });

  test('should have layout gallery with slide templates', async ({ page }) => {
    const assistantToggle = page.locator('#assistant-toggle');
    await assistantToggle.click();
    
    // Click on FOLIEN tab
    await page.locator('#assistant-layouts-tab').click();
    await expect(page.locator('#assistant-layouts-view')).not.toBeHidden();
    
    // Check layout gallery exists
    await expect(page.locator('#layout-gallery')).toBeVisible();
    
    // Check for some layout cards
    const layoutCards = page.locator('.layout-card');
    await expect(layoutCards.first()).toBeVisible();
  });

  test('should have element panel', async ({ page }) => {
    const elementsToggle = page.locator('#elements-toggle');
    await expect(elementsToggle).toBeVisible();
    
    await elementsToggle.click();
    await expect(page.locator('#element-panel')).not.toBeHidden();
    
    // Check element action buttons
    await expect(page.locator('#add-text-button')).toBeVisible();
    await expect(page.locator('#add-shape-button')).toBeVisible();
    await expect(page.locator('#add-image-button')).toBeVisible();
    await expect(page.locator('#add-video-button')).toBeVisible();
  });

  test('should add text element', async ({ page }) => {
    const elementsToggle = page.locator('#elements-toggle');
    await elementsToggle.click();
    
    await page.locator('#add-text-button').click();
    
    // Check that element was added to the list
    const elementList = page.locator('#element-list');
    await expect(elementList.locator('.element-list-item')).toHaveCount(1);
  });

  test('should have roadmap tab', async ({ page }) => {
    const assistantToggle = page.locator('#assistant-toggle');
    await assistantToggle.click();
    
    // Check roadmap tab exists
    await expect(page.locator('#assistant-roadmap-tab')).toBeVisible();
    
    await page.locator('#assistant-roadmap-tab').click();
    await expect(page.locator('#assistant-roadmap-view')).not.toBeHidden();
    
    // Check roadmap builder elements
    await expect(page.locator('#roadmap-canvas')).toBeVisible();
    await expect(page.locator('#roadmap-add-phase')).toBeVisible();
    await expect(page.locator('#roadmap-add-milestone')).toBeVisible();
    await expect(page.locator('#roadmap-apply')).toBeVisible();
  });

  test('should add roadmap phase', async ({ page }) => {
    const assistantToggle = page.locator('#assistant-toggle');
    await assistantToggle.click();
    
    await page.locator('#assistant-roadmap-tab').click();
    
    await page.locator('#roadmap-add-phase').click();
    
    // Check that phase was added to canvas
    const roadmapElements = page.locator('.roadmap-element');
    await expect(roadmapElements).toHaveCount(1);
  });

  test('should have starter slides in layout gallery', async ({ page }) => {
    const assistantToggle = page.locator('#assistant-toggle');
    await assistantToggle.click();
    
    await page.locator('#assistant-layouts-tab').click();
    
    // Check for starter slide cards
    const layoutCards = page.locator('.layout-card');
    const count = await layoutCards.count();
    expect(count).toBeGreaterThanOrEqual(7); // At least 7 starter slides
  });
});
