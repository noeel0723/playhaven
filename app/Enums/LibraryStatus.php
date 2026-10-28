<?php

namespace App\Enums;

enum LibraryStatus: string
{
    case Playing = 'playing';
    case Completed = 'completed';
    case Paused = 'paused';
    case Dropped = 'dropped';
    case Backlog = 'backlog';
}
