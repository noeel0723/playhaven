<?php

namespace App\Enums;

enum ListVisibility: string
{
    case Public = 'public';
    case Unlisted = 'unlisted';
    case Private = 'private';
}
