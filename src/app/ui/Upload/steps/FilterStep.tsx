import { useState } from "react";
import Image from "next/image";
import styles from "./FilterStep.module.scss";
import { UploadPostProps } from "..";

export default function FilterStep({
  mediaType,
  mediaPreview,
  filter,
  croppedMediaPreview,
}: Pick<UploadPostProps, "mediaType" | "mediaPreview" | "filter"> & {
  croppedMediaPreview?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"filter" | "adjust">("filter");
  const [showPanel, setShowPanel] = useState(false);

  if (!filter) return null;
  return (
    <div className={styles.filterContent}>
      <div className={styles.filterImageContainer}>
        {mediaType === "image" && (croppedMediaPreview || mediaPreview) && (
          <div className={styles.filterImageWrapper}>
            <Image
              src={(croppedMediaPreview || mediaPreview) ?? ""}
              alt="Preview"
              fill
              className={`${styles.filterImage} ${
                styles[filter.selected.toLowerCase()]
              }`}
            />
          </div>
        )}
        {mediaType === "video" && mediaPreview && (
          <div className={styles.filterImageWrapper}>
            <video
              src={mediaPreview}
              controls
              className={styles.filterImage}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          </div>
        )}
      </div>
      {/* Mobile bottom tabs */}
      <div className={styles.mobileTabsContainer}>
        <div className={styles.mobileFilterTabs}>
          <button
            className={`${styles.mobileFilterTab} ${
              activeTab === "filter" ? styles.active : ""
            }`}
            onClick={() => {
              setActiveTab("filter");
              setShowPanel(activeTab === "filter" ? !showPanel : true);
            }}
          >
            Bộ Lọc
          </button>
          <button
            className={`${styles.mobileFilterTab} ${
              activeTab === "adjust" ? styles.active : ""
            }`}
            onClick={() => {
              setActiveTab("adjust");
              setShowPanel(activeTab === "adjust" ? !showPanel : true);
            }}
          >
            Điều Chỉnh
          </button>
        </div>
      </div>

      {/* Desktop filter panel */}
      <div className={styles.filterPanel}>
        <div className={styles.filterTabs}>
          <button className={`${styles.filterTab} ${styles.active}`}>
            Bộ Lọc
          </button>
          <button className={styles.filterTab}>Điều Chỉnh</button>
        </div>
        <div className={styles.filterGrid}>
          {filter.filters.map((f) => (
            <div
              key={f}
              className={`${styles.filterItem} ${
                filter.selected === f ? styles.selected : ""
              }`}
              onClick={() => filter.setSelected(f)}
            >
              <div className={styles.filterPreview}>
                <Image
                  src={mediaPreview || "/api/placeholder/70/70"}
                  alt={f}
                  width={70}
                  height={70}
                  className={`${styles.filterPreviewImage} ${
                    styles[f.toLowerCase()]
                  }`}
                />
              </div>
              <span className={styles.filterName}>
                {f === "none" ? "Gốc" : f.split("(")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile slide up panel */}
      <div
        className={`${styles.mobileFilterPanel} ${
          showPanel ? styles.show : ""
        }`}
      >
        <div className={styles.mobilePanelHandle}></div>
        {activeTab === "filter" && (
          <div className={styles.mobileFilterGrid}>
            {filter.filters.map((f) => (
              <div
                key={f}
                className={`${styles.mobileFilterItem} ${
                  filter.selected === f ? styles.selected : ""
                }`}
                onClick={() => {
                  filter.setSelected(f);
                  setShowPanel(false);
                }}
              >
                <div className={styles.mobileFilterPreview}>
                  <Image
                    src={mediaPreview || "/api/placeholder/70/70"}
                    alt={f}
                    width={60}
                    height={60}
                    className={`${styles.mobileFilterPreviewImage} ${
                      styles[f.toLowerCase()]
                    }`}
                  />
                </div>
                <span className={styles.mobileFilterName}>
                  {f === "none" ? "Gốc" : f.split("(")[0]}
                </span>
              </div>
            ))}
          </div>
        )}
        {activeTab === "adjust" && (
          <div className={styles.adjustPanel}>
            <p style={{ color: "white", textAlign: "center", padding: "20px" }}>
              Điều chỉnh sẽ được thêm sau
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
