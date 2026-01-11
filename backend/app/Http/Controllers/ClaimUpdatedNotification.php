<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class ClaimUpdatedNotification extends Notification
{
    use Queueable;

    protected $message;

    public function __construct($message)
    {
        $this->message = $message;
    }

    public function via($notifiable)
    {
        return ['database']; // You can add 'mail' here if needed
    }

    public function toDatabase($notifiable)
    {
        return new DatabaseMessage([
            'message' => $this->message,
        ]);
    }
}
