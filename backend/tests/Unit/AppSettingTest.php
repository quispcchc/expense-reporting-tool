<?php

namespace Tests\Unit;

use App\Models\AppSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_value_returns_existing_setting(): void
    {
        $value = AppSetting::getValue('mileage_rate');

        $this->assertEquals('0.5', $value);
    }

    public function test_get_value_returns_default_when_not_found(): void
    {
        $value = AppSetting::getValue('nonexistent', 'fallback');

        $this->assertEquals('fallback', $value);
    }

    public function test_get_value_returns_null_when_not_found_and_no_default(): void
    {
        $value = AppSetting::getValue('nonexistent');

        $this->assertNull($value);
    }

    public function test_set_value_creates_new_setting(): void
    {
        $setting = AppSetting::setValue('new_key', 'new_value');

        $this->assertInstanceOf(AppSetting::class, $setting);
        $this->assertDatabaseHas('app_settings', [
            'key' => 'new_key',
            'value' => 'new_value',
        ]);
    }

    public function test_set_value_updates_existing_setting(): void
    {
        AppSetting::setValue('mileage_rate', '0.75');

        $this->assertDatabaseHas('app_settings', [
            'key' => 'mileage_rate',
            'value' => '0.75',
        ]);

        // Ensure there is only one record with this key
        $this->assertEquals(1, AppSetting::where('key', 'mileage_rate')->count());
    }
}
