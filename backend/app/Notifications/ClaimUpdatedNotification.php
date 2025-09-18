<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ClaimUpdatedNotification extends Notification
{
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($message)
    {
        $this->message = $message;
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
            ->subject('Claim Updated')
            ->line($this->message)
            ->action('View Claim', url('/claims')) // Adjust the URL to point to your claims page
            ->line('Thank you for using our application!');
    }
}
