<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Bus\Queueable;

class ClaimUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Claim $claim;
    protected ?string $customMessage;

    /**
     * Create a new notification instance.
     */
    public function __construct(Claim $claim, ?string $customMessage = null)
    {
        $this->claim = $claim;
        $this->customMessage = $customMessage;
    }

    /**
     * Get the notification delivery channels.
     */
    public function via($notifiable)
    {
        return ['mail']; // You can also add 'database' if you want to store it in the database
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $url = $frontendUrl . "/user/claims/{$this->claim->claim_id}/view-claim";

        $mailMessage = (new MailMessage)
            ->subject("Claim #{$this->claim->claim_id} Updated");

        if ($this->customMessage) {
            $mailMessage->line($this->customMessage);
        } else {
            $mailMessage->line("Your claim status has been updated to: **{$this->claim->status->claim_status_name}**.");
        }

        return $mailMessage
            ->line("Total Amount: {$this->claim->total_amount}")
            ->action('View Claim', $url)
            ->line('Thank you for using our application!');
    }
}
