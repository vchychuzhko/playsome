<?php
declare(strict_types=1);

namespace App\Controller;

use App\Repository\PodcastRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class Index extends AbstractController
{
    private PodcastRepository $podcastRepository;

    private TranslatorInterface $translator;

    /**
     * Index constructor.
     * @param PodcastRepository $podcastRepository
     * @param TranslatorInterface $translator
     */
    public function __construct(
        PodcastRepository $podcastRepository,
        TranslatorInterface $translator
    ) {
        $this->podcastRepository = $podcastRepository;
        $this->translator = $translator;
    }

    #[Route('/', name: 'player_index')]
    public function index(): Response
    {
        return $this->render('player/index.html.twig', [
            'lang' => $this->translator->getLocale(),
            'locales' => $this->getLocales(),
            'title' => $this->getTitle(),
            'description' => $this->getDescription(),
            'keywords' => $this->getKeywords(),
        ]);
    }

    #[Route('/listen', name: 'player_listen')]
    public function listen(Request $request): Response
    {
        $code = $request->query->get('p');

        $podcast = $code ? $this->podcastRepository->findOneByCode($code) : null;

        if (!$podcast) {
            return $this->index($request);
        }

        return $this->render('player/index.html.twig', [
            'lang' => $this->translator->getLocale(),
            'locales' => $this->getLocales(),
            'title' => $this->getTitle(),
            'full_title' => $podcast->getTitle() . ' | ' . $this->getTitle(),
            'description' => $this->getDescription(),
            'keywords' => $this->getKeywords(),

            'og_title' => $podcast->getTitle(),
            'og_type' => 'music.song',
            'og_image' => $podcast->getThumbnail(),
            'og_audio' => $podcast->getSrc(),
            'og_url' => $this->generateUrl('player_listen', ['p' => $podcast->getCode()]),
        ]);
    }

    /**
     * @return string
     */
    private function getTitle(): string
    {
        return 'PlaySome';
        // @TODO: Move meta information to database
    }

    /**
     * @return string
     */
    private function getDescription(): string
    {
        return $this->translator->trans('Web app to visualize the music in real time');
    }

    /**
     * @return string
     */
    private function getKeywords(): string
    {
        return 'PlaySome,Play,Visualizer,Audio,Spectrum,Visualization,Visualize,Music,Podcast';
    }

    /**
     * @return array
     */
    private function getLocales(): array
    {
        return [
            [
                'lang' => 'en',
                'label' => 'EN'
            ],
            [
                'lang' => 'uk',
                'label' => 'UA'
            ]
        ];
    }
}
