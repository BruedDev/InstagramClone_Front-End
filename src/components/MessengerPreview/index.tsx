"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAvailableUsers } from "@/store/messengerSlice";
import MessengerModal from "./MessengerModal";
import Image from "next/image";

export default function MessengerPreview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const availableUsers = useAppSelector(
    (state) => state.messenger.availableUsers
  );

  useEffect(() => {
    dispatch(fetchAvailableUsers());
  }, [dispatch]);

  const top3Users = availableUsers.slice(0, 3);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Nút Messenger */}
      <div
        onClick={handleOpenModal}
        className="fixed bottom-6 right-12 z-[997] h-14 rounded-full shadow-lg flex items-center justify-between px-4 cursor-pointer hover:shadow-xl transition-shadow min-w-[250px] bg-[#212328] hover:bg-[#38393e]"
      >
        {/* Bên trái: Icon và Text */}
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 mr-2">
            <svg
              aria-label="Tin nhắn trực tiếp"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <title>Tin nhắn trực tiếp</title>
              <path
                d="M12.003 2.001a9.705 9.705 0 1 1 0 19.4 10.876 10.876 0 0 1-2.895-.384.798.798 0 0 0-.533.04l-1.984.876a.801.801 0 0 1-1.123-.708l-.054-1.78a.806.806 0 0 0-.27-.569 9.49 9.49 0 0 1-3.14-7.175 9.65 9.65 0 0 1 10-9.7Z"
                fill="none"
                stroke="currentColor"
                stroke-miterlimit="10"
                stroke-width="1.739"
              ></path>
              <path
                d="M17.79 10.132a.659.659 0 0 0-.962-.873l-2.556 2.05a.63.63 0 0 1-.758.002L11.06 9.47a1.576 1.576 0 0 0-2.277.42l-2.567 3.98a.659.659 0 0 0 .961.875l2.556-2.049a.63.63 0 0 1 .759-.002l2.452 1.84a1.576 1.576 0 0 0 2.278-.42Z"
                fill-rule="evenodd"
              ></path>
            </svg>
          </div>
          <span className="text-sm font-medium text-white">Tin nhắn</span>
        </div>

        {/* Bên phải: Avatar người dùng */}
        <div className="flex items-center space-x-1">
          {top3Users.map((user, idx) => (
            <div
              key={user._id}
              className={`w-7 h-7 rounded-full ${
                idx > 0 ? "-ml-2" : ""
              } bg-gray-600 overflow-hidden`}
            >
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.username}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Messenger */}
      <MessengerModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
