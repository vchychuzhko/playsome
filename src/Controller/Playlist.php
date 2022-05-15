<?php
declare(strict_types=1);

namespace App\Controller;

use App\Repository\PodcastRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\Cache\CacheInterface;

class Playlist extends AbstractController
{
    private CacheInterface $cache;

    private PodcastRepository $podcastRepository;

    /**
     * Playlist constructor.
     * @param CacheInterface $cache
     * @param PodcastRepository $podcastRepository
     */
    public function __construct(
        CacheInterface $cache,
        PodcastRepository $podcastRepository
    ) {
        $this->cache = $cache;
        $this->podcastRepository = $podcastRepository;
    }

    /**
     * @Route("/list", name="player_playlist")
     */
    public function list(): JsonResponse
    {
        $list = $this->cache->get('player_playlist', function () {
            $podcasts = $this->podcastRepository->findBy([], ['id' => 'DESC']);

            return array_map(fn($podcast) => $podcast->getData(), $podcasts);
        });

        return $this->json($list);
    }
}
