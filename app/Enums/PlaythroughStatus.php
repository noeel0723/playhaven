<?php

namespace App\Enums;

enum PlaythroughStatus: string
{
    case Playing = 'playing';
    case Completed = 'completed';
    case Paused = 'paused';
    case Dropped = 'dropped';
}
