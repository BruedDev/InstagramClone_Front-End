import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { checkOnline } from "@/store/messengerSlice";
import { AppDispatch } from "@/store/index";
import type { User } from "@/types/user.type";

type UserStatusMap = {
  [userId: string]: "online" | "offline";
};

export const useCheckOnline = (users: User[]) => {
  const [userStatuses, setUserStatuses] = useState<UserStatusMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const checkUsersStatus = useCallback(
    async (userList: User[]) => {
      if (userList.length === 0) return;

      setIsLoading(true);
      const statusMap: UserStatusMap = {};

      for (const user of userList) {
        try {
          const result = await dispatch(checkOnline(user._id)).unwrap();
          statusMap[user._id] = result.status;
        } catch {
          statusMap[user._id] = "offline";
        }
      }

      setUserStatuses(statusMap);
      setIsLoading(false);
    },
    [dispatch]
  );

  const checkSingleUserStatus = async (userId: string) => {
    try {
      const result = await dispatch(checkOnline(userId)).unwrap();
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: result.status,
      }));
      return result.status;
    } catch {
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: "offline",
      }));
      return "offline";
    }
  };

  const isUserOnline = (userId: string) => {
    return userStatuses[userId] === "online";
  };

  const getUserStatus = (userId: string) => {
    return userStatuses[userId] || "offline";
  };

  useEffect(() => {
    checkUsersStatus(users);
  }, [users, checkUsersStatus]);

  return {
    userStatuses,
    isLoading,
    checkUsersStatus,
    checkSingleUserStatus,
    isUserOnline,
    getUserStatus,
  };
};
