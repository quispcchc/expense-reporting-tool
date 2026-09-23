<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Bus\Queueable;

class ClaimCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Claim $claim;
    protected ?string $recipientName;

    /**
     * Create a new notification instance.
     */
    public function __construct(Claim $claim, ?string $recipientName = null)
    {
        $this->claim = $claim;
        $this->recipientName = $recipientName;
    }

    /**
     * Get the notification delivery channels.
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $url = $frontendUrl . "/user/claims/{$this->claim->claim_id}/view-claim";

        $greeting = $this->recipientName ? "Hello {$this->recipientName}," : "Hello,";

        return (new MailMessage)
            ->subject("New Claim #{$this->claim->claim_id} Submitted")
            ->greeting($greeting)
            ->line("A new claim has been submitted and is pending review.")
            ->line("Claimant: {$this->claim->user->full_name}")
            ->line("Total Amount: {$this->claim->total_amount}")
            ->action('View Claim', $url)
            ->line('Thank you for using our application!');
    }
}
