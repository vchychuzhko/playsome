<?php
declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class Playlist extends AbstractController
{
    /**
     * @Route("/playlist", name="player_playlist")
     */
    public function list(): JsonResponse
    {

        return $this->json([]);
    }
}
