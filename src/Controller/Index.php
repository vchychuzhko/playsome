<?php
declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

class Index extends AbstractController
{
    /**
     * @var TranslatorInterface $translator
     */
    private $translator;

    /**
     * Index controller.
     * @param TranslatorInterface $translator
     */
    public function __construct(
        TranslatorInterface $translator
    ) {
        $this->translator = $translator;
    }

    /**
     * @Route("/", name="player_index")
     */
    public function index(Request $request): Response
    {
        return $this->render('player/index.html.twig', [
            'lang' => $request->getLocale(),
            'title' => 'PlaySome',
            'description' => $this->translator->trans('Web app to visualize the music in real time'),
            'keywords' => 'PlaySome,Play,Visualizer,Audio,Spectrum,Visualization,Visualize,Music,Podcast'
        ]);
    }
}
