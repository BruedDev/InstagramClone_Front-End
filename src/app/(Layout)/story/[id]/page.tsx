"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchStoryHome, getStoryById } from "@/store/story";
import StoryModal from "@/components/Modal/Story/StoryModal";
import Loading from "@/components/Loading/Loading";

export default function StoryPageDetail() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { stories, currentUserStories } = useAppSelector(
    (state) => state.story
  );
  const id = params?.id as string | undefined;

  // Fetch all grouped stories on mount
  useEffect(() => {
    dispatch(fetchStoryHome());
  }, [dispatch]);

  // Find the group and story index by id from URL
  const { group, storyIndex } = useMemo(() => {
    let group,
      storyIndex = 0;
    if (id && stories && stories.length > 0) {
      for (const g of stories) {
        const idx = g.stories.findIndex((s) => s._id === id);
        if (idx !== -1) {
          group = g;
          storyIndex = idx;
          break;
        }
      }
    }
    return { group, storyIndex };
  }, [id, stories]);

  // Fetch all stories of the author when group changes
  useEffect(() => {
    if (group?.author?.username) {
      dispatch(getStoryById(group.author.username));
    }
  }, [group, dispatch]);

  // Prepare stories for StoryModal (convert to StoryModal format)
  const modalStories = useMemo(() => {
    return (currentUserStories || []).map((story) => {
      // Nếu story là kiểu API trả về (có author, media, mediaType...)
      if ("author" in story) {
        // @ts-expect-error: API trả về story không đúng định dạng StoryModal, cần chuyển đổi thủ công
        const s = story as {
          _id: string;
          media: string;
          mediaType: string;
          audio?: string;
          audioDuration?: number;
          createdAt: string;
        };
        let type: "image" | "video" = "image";
        if (s.mediaType && s.mediaType.includes("video")) type = "video";
        else if (s.mediaType && s.mediaType.includes("image")) type = "image";
        return {
          _id: s._id,
          mediaUrl: s.media || "",
          mediaType: type,
          audioUrl: s.audio || undefined,
          createdAt: s.createdAt || new Date().toISOString(),
          audioDuration: s.audioDuration || undefined,
        };
      }
      // Nếu story đã đúng định dạng cho StoryModal
      return story as unknown as {
        _id: string;
        mediaUrl: string;
        mediaType: "image" | "video";
        audioUrl?: string;
        createdAt: string;
        audioDuration?: number;
      };
    });
  }, [currentUserStories]);

  // Handle close logic for detail page
  const handleClose = () => {
    if (window.history.length > 1) {
      router.push("/");
    } else {
      router.push("/");
    }
  };

  if (!group || !modalStories.length) return <Loading />;

  return (
    <StoryModal
      open={true}
      onClose={handleClose}
      stories={modalStories}
      author={group.author}
      initialIndex={storyIndex}
      deltail={true}
    />
  );
}
