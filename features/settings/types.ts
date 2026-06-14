// 사용자별 생성 기본값. captionStyle은 project 도메인의 CaptionStyle JSON이지만,
// feature 간 결합을 피하려 여기서는 불투명 값으로 두고 소비처(route 레이어)에서
// project의 parseCaptionStyle로 정규화한다.
export interface GenerationDefaults {
  language: string;
  contentType: string;
  captionStyle: unknown;
}
