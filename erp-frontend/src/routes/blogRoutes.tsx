import BlogListPage from "../features/blog/page/BlogListPage";
import BlogEditorPage from "../features/blog/page/BlogEditorPage";
import BlogDetailPage from "../features/blog/page/BlogDetailPage";

const blogRoutes = [
  {
    path: "/blog",
    element: <BlogListPage />,
  },
  {
    path: "/blog/create",
    element: <BlogEditorPage />,
  },
  {
    path: "/blog/edit/:id",
    element: <BlogEditorPage />,
  },
  {
    path: "/blog/:idOrSlug",
    element: <BlogDetailPage />,
  },
];

export default blogRoutes;
