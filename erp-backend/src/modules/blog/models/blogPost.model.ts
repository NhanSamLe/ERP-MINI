import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface BlogPostAttrs {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string | null;
  status: "draft" | "published";
  author_id: number;
  product_id?: number | null;
  seo_title?: string | null;
  seo_meta_desc?: string | null;
  seo_keywords?: string | null;
  image_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

type BlogPostCreation = Optional<
  BlogPostAttrs,
  "id" | "status" | "summary" | "product_id" | "seo_title" | "seo_meta_desc" | "seo_keywords" | "image_url"
>;

export class BlogPost
  extends Model<BlogPostAttrs, BlogPostCreation>
  implements BlogPostAttrs
{
  public id!: number;
  public title!: string;
  public slug!: string;
  public content!: string;
  public summary?: string | null;
  public status!: "draft" | "published";
  public author_id!: number;
  public product_id?: number | null;
  public seo_title?: string | null;
  public seo_meta_desc?: string | null;
  public seo_keywords?: string | null;
  public image_url?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

BlogPost.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("draft", "published"),
      allowNull: false,
      defaultValue: "draft",
    },
    author_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: true },
    seo_title: { type: DataTypes.STRING(255), allowNull: true },
    seo_meta_desc: { type: DataTypes.TEXT, allowNull: true },
    seo_keywords: { type: DataTypes.STRING(255), allowNull: true },
    image_url: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    tableName: "blog_posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
