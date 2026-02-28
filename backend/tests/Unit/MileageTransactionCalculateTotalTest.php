<?php

namespace Tests\Unit;

use App\Models\MileageTransaction;
use PHPUnit\Framework\TestCase;

class MileageTransactionCalculateTotalTest extends TestCase
{
    public function test_basic_calculation()
    {
        $result = MileageTransaction::calculateTotal(100, 0.41, 5.0, 2.0);

        $this->assertEquals(48.00, $result);
    }

    public function test_zero_distance()
    {
        $result = MileageTransaction::calculateTotal(0, 0.41, 5.0, 2.0);

        $this->assertEquals(7.00, $result);
    }

    public function test_zero_rate()
    {
        $result = MileageTransaction::calculateTotal(100, 0, 5.0, 2.0);

        $this->assertEquals(7.00, $result);
    }

    public function test_null_parking_and_meter()
    {
        $result = MileageTransaction::calculateTotal(100, 0.5, null, null);

        $this->assertEquals(50.00, $result);
    }

    public function test_all_zeros()
    {
        $result = MileageTransaction::calculateTotal(0, 0, 0, 0);

        $this->assertEquals(0.00, $result);
    }

    public function test_rounding_to_two_decimals()
    {
        // 33 * 0.41 = 13.53
        $result = MileageTransaction::calculateTotal(33, 0.41, 0, 0);

        $this->assertEquals(13.53, $result);
    }

    public function test_large_values()
    {
        // 9999 * 0.41 + 999.99 + 888.88 = 4099.59 + 999.99 + 888.88 = 5988.46
        $result = MileageTransaction::calculateTotal(9999, 0.41, 999.99, 888.88);

        $this->assertEquals(5988.46, $result);
    }
}
