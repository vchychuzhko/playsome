<?php

namespace App\Entity;

use App\Repository\PodcastRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PodcastRepository::class)]
class Podcast
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(length: 255)]
    private string $artist;

    #[ORM\Column(length: 255)]
    private string $code;

    #[ORM\Column(type: Types::TEXT)]
    private string $src;

    #[ORM\Column(length: 10)]
    private string $duration;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $thumbnail;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $background;

    #[ORM\Column(nullable: true)]
    private array $playlist = [];

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getArtist(): ?string
    {
        return $this->artist;
    }

    public function setArtist(string $artist): self
    {
        $this->artist = $artist;

        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

        return $this;
    }

    public function getSrc(): ?string
    {
        return $this->src;
    }

    public function setSrc(string $src): self
    {
        $this->src = $src;

        return $this;
    }

    public function getDuration(): ?string
    {
        return $this->duration;
    }

    public function setDuration(string $duration): self
    {
        $this->duration = $duration;

        return $this;
    }

    public function getThumbnail(): ?string
    {
        return $this->thumbnail;
    }

    public function setThumbnail(?string $thumbnail): self
    {
        $this->thumbnail = $thumbnail;

        return $this;
    }

    public function getBackground(): ?string
    {
        return $this->background;
    }

    public function setBackground(?string $background): self
    {
        $this->background = $background;

        return $this;
    }

    public function getPlaylist(): ?array
    {
        return $this->playlist;
    }

    public function setPlaylist(?array $playlist): self
    {
        $this->playlist = $playlist;

        return $this;
    }

    /**
     * Prepare and format podcast data.
     * @return array
     */
    public function getData(): array
    {
        return [
            'id'         => $this->getCode(),
            'title'      => $this->getTitle(),
            'artist'     => $this->getArtist(),
            'src'        => $this->getSrc(),
            'duration'   => $this->getDuration(),
            'thumbnail'  => $this->getThumbnail(),
            'background' => $this->getBackground(),
            'playlist'   => $this->getPlaylist(),
        ];
    }
}
