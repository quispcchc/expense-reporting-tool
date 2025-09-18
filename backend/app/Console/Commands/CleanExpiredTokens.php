<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clean-expired-tokens';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        DB::table('password_reset_tokens')->where('created_at', '<', now()->subMinutes(60))->delete();
        DB::table('email_verification_tokens')->where('created_at', '<', now()->subHours(24))->delete();

        $this->info('Expired tokens cleaned.');
    }
}
