<?php

namespace App\Notifications;

use App\Models\Claim;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClaimUpdatedNotification extends Notification
{
    protected Claim $claim;

    /**
     * Create a new notification instance.
     */
    public function __construct(Claim $claim)
    {
        $this->claim = $claim;
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

        return (new MailMessage)
            ->subject("Claim #{$this->claim->claim_id} Updated")
            ->line("Your claim status has been updated to: **{$this->claim->status->claim_status_name}**.")
            ->line("Total Amount: {$this->claim->total_amount}")
            ->action(
                'View Claim',
                url("/user/claims/{$this->claim->claim_id}/view-claim"))
            ->line('Thank you for using our application!');
    }
}
