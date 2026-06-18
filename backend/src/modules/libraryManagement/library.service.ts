
// ============================================
// LIBRARY SERVICE — Saari business logic yahan hai
// School ERP - Library Management Module
// ============================================

import prisma from "../../utils/prisma";

// ==================== TYPES ====================
interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface BookFilters extends PaginationParams {
  categoryId?: string;
  author?: string;
  language?: string;
  available?: boolean;
}

interface MemberFilters extends PaginationParams {
  memberType?: string;
  status?: string;
}

interface IssueBookInput {
  bookId: string;
  memberId: string;
  issuedBy: string;
  remarks?: string;
}

interface ReturnBookInput {
  issueId: string;
  returnedBy: string;
  fineStatus?: string;
  remarks?: string;
}

// ==================== DASHBOARD ====================
// Dashboard stats nikalne ke liye — admin ko sab dikhega
export const getDashboardStats = async (tenantId: string) => {
  console.log("📊 Dashboard stats fetch ho raha hai for tenant:", tenantId);

  const [
    totalBooks,
    totalMembers,
    booksIssued,
    overdueBooks,
    fineData,
    recentActivity,
  ] = await Promise.all([
    // Total books count
    prisma.book.aggregate({
      where: { tenantId, isDeleted: false },
      _sum: { totalCopies: true },
    }),
    // Total active members
    prisma.libraryMember.count({
      where: { tenantId, isDeleted: false, status: "ACTIVE" },
    }),
    // Currently issued books
    prisma.bookIssue.count({
      where: { tenantId, isDeleted: false, status: "ISSUED" },
    }),
    // Overdue books — jinka due date nikal gaya
    prisma.bookIssue.count({
      where: {
        tenantId,
        isDeleted: false,
        status: "ISSUED",
        dueDate: { lt: new Date() },
      },
    }),
    // Total fine collected
    prisma.bookIssue.aggregate({
      where: { tenantId, isDeleted: false, fineStatus: "PAID" },
      _sum: { fineAmount: true },
    }),
    // Recent activity — last 10 transactions
    prisma.bookIssue.findMany({
      where: { tenantId, isDeleted: false },
      include: {
        book: { select: { title: true, author: true } },
        member: { select: { name: true, membershipId: true, memberType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Unique books count (titles)
  const uniqueBooks = await prisma.book.count({
    where: { tenantId, isDeleted: false },
  });

  return {
    totalBooks: totalBooks._sum.totalCopies || 0,
    uniqueBooks,
    totalMembers,
    booksIssued,
    overdueBooks,
    totalFineCollected: fineData._sum.fineAmount || 0,
    recentActivity,
  };
};

// ==================== BOOKS CRUD ====================
// Saari books fetch karo with filters aur pagination
export const getAllBooks = async (tenantId: string, filters: BookFilters) => {
  const { page = 1, limit = 10, search, categoryId, author, language, available } = filters;
  const skip = (page - 1) * limit;

  console.log("📚 Books fetch ho rahi hain — Page:", page, "Search:", search);

  // Where conditions build karo
  const where: any = { tenantId, isDeleted: false };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
      { isbn: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (author) where.author = { contains: author, mode: "insensitive" };
  if (language) where.language = language;
  if (available === true) where.availableCopies = { gt: 0 };
  if (available === false) where.availableCopies = 0;

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  return {
    books,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Nayi book add karo
export const createBook = async (tenantId: string, data: any) => {
  console.log("📖 Nayi book add ho rahi hai:", data.title);

  const book = await prisma.book.create({
    data: {
      ...data,
      tenantId,
      availableCopies: data.totalCopies || 1,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return book;
};

// Book update karo
export const updateBook = async (tenantId: string, bookId: string, data: any) => {
  console.log("✏️ Book update ho rahi hai:", bookId);

  // Agar totalCopies change ho rahe hain, available copies bhi adjust karo
  if (data.totalCopies !== undefined) {
    const existingBook = await prisma.book.findFirst({
      where: { id: bookId, tenantId, isDeleted: false },
    });

    if (!existingBook) throw new Error("Book not found");

    const issuedCopies = existingBook.totalCopies - existingBook.availableCopies;
    data.availableCopies = Math.max(0, data.totalCopies - issuedCopies);
  }

  const book = await prisma.book.update({
    where: { id: bookId },
    data,
    include: { category: { select: { id: true, name: true } } },
  });

  return book;
};

// Book soft delete karo
export const deleteBook = async (tenantId: string, bookId: string) => {
  console.log("🗑️ Book delete ho rahi hai:", bookId);

  // Check karo ki koi issue toh nahi hai
  const activeIssue = await prisma.bookIssue.findFirst({
    where: { bookId, tenantId, status: "ISSUED", isDeleted: false },
  });

  if (activeIssue) {
    throw new Error("Cannot delete book — it has active issues. Pehle return karwao!");
  }

  const book = await prisma.book.update({
    where: { id: bookId },
    data: { isDeleted: true },
  });

  return book;
};

// Single book fetch karo
export const getBookById = async (tenantId: string, bookId: string) => {
  const book = await prisma.book.findFirst({
    where: { id: bookId, tenantId, isDeleted: false },
    include: {
      category: { select: { id: true, name: true } },
      issues: {
        where: { isDeleted: false },
        include: { member: { select: { name: true, membershipId: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!book) throw new Error("Book not found");
  return book;
};

// ==================== BOOK CATEGORIES ====================
// Saari categories fetch karo
export const getAllCategories = async (tenantId: string) => {
  console.log("📂 Categories fetch ho rahi hain");

  const categories = await prisma.bookCategory.findMany({
    where: { tenantId, isDeleted: false },
    include: { _count: { select: { books: true } } },
    orderBy: { name: "asc" },
  });

  return categories;
};

// Category create karo
export const createCategory = async (tenantId: string, data: { name: string; description?: string }) => {
  console.log("📂 Nayi category ban rahi hai:", data.name);

  // Duplicate check
  const existing = await prisma.bookCategory.findFirst({
    where: { name: data.name, tenantId, isDeleted: false },
  });

  if (existing) throw new Error("Category already exists with this name!");

  const category = await prisma.bookCategory.create({
    data: { ...data, tenantId },
  });

  return category;
};

// Category delete karo
export const deleteCategory = async (tenantId: string, categoryId: string) => {
  // Check karo ki books toh nahi hain isme
  const booksCount = await prisma.book.count({
    where: { categoryId, tenantId, isDeleted: false },
  });

  if (booksCount > 0) {
    throw new Error(`Cannot delete — ${booksCount} books are in this category!`);
  }

  await prisma.bookCategory.update({
    where: { id: categoryId },
    data: { isDeleted: true },
  });

  return { message: "Category deleted successfully" };
};

// ==================== MEMBERS ====================
// Auto-generate membershipId — LIB-001, LIB-002, etc.
const generateMembershipId = async (tenantId: string): Promise<string> => {
  const lastMember = await prisma.libraryMember.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: { membershipId: true },
  });

  if (!lastMember) return "LIB-001";

  const lastNumber = parseInt(lastMember.membershipId.split("-")[1]);
  const newNumber = lastNumber + 1;
  return `LIB-${String(newNumber).padStart(3, "0")}`;
};

// Saare members fetch karo
export const getAllMembers = async (tenantId: string, filters: MemberFilters) => {
  const { page = 1, limit = 10, search, memberType, status } = filters;
  const skip = (page - 1) * limit;

  console.log("👥 Members fetch ho rahe hain — Page:", page);

  const where: any = { tenantId, isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { membershipId: { contains: search, mode: "insensitive" } },
    ];
  }
  if (memberType) where.memberType = memberType;
  if (status) where.status = status;

  const [members, total] = await Promise.all([
    prisma.libraryMember.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.libraryMember.count({ where }),
  ]);

  return {
    members,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Naya member add karo
export const createMember = async (tenantId: string, data: any) => {
  console.log("👤 Naya member register ho raha hai:", data.name);

  // Settings se max books allowed fetch karo
  const settings = await getLibrarySettings(tenantId);
  let maxBooks = 3;
  if (data.memberType === "STUDENT") maxBooks = settings.maxBooksPerStudent;
  else if (data.memberType === "TEACHER") maxBooks = settings.maxBooksPerTeacher;
  else if (data.memberType === "STAFF") maxBooks = settings.maxBooksPerStaff;

  const membershipId = await generateMembershipId(tenantId);

  const member = await prisma.libraryMember.create({
    data: {
      ...data,
      membershipId,
      maxBooksAllowed: maxBooks,
      tenantId,
    },
  });

  return member;
};

// Member update karo
export const updateMember = async (tenantId: string, memberId: string, data: any) => {
  console.log("✏️ Member update ho raha hai:", memberId);

  const member = await prisma.libraryMember.update({
    where: { id: memberId },
    data,
  });

  return member;
};

// Member delete (soft) karo
export const deleteMember = async (tenantId: string, memberId: string) => {
  console.log("🗑️ Member delete ho raha hai:", memberId);

  // Check active issues
  const activeIssues = await prisma.bookIssue.count({
    where: { memberId, tenantId, status: "ISSUED", isDeleted: false },
  });

  if (activeIssues > 0) {
    throw new Error(`Cannot delete — member has ${activeIssues} active book(s) issued!`);
  }

  await prisma.libraryMember.update({
    where: { id: memberId },
    data: { isDeleted: true, status: "EXPIRED" },
  });

  return { message: "Member deleted successfully" };
};

// ==================== ISSUE / RETURN ====================
// Book issue karo — sabse important function hai ye
export const issueBook = async (tenantId: string, input: IssueBookInput) => {
  const { bookId, memberId, issuedBy, remarks } = input;
  console.log("📤 Book issue ho rahi hai — Book:", bookId, "Member:", memberId);

  // Settings fetch karo
  const settings = await getLibrarySettings(tenantId);

  // Book verify karo
  const book = await prisma.book.findFirst({
    where: { id: bookId, tenantId, isDeleted: false },
  });
  if (!book) throw new Error("Book not found!");
  if (book.availableCopies <= 0) throw new Error("Book available nahi hai — sab copies issued hain!");

  // Member verify karo
  const member = await prisma.libraryMember.findFirst({
    where: { id: memberId, tenantId, isDeleted: false },
  });
  if (!member) throw new Error("Member not found!");
  if (member.status !== "ACTIVE") throw new Error("Member ka account ACTIVE nahi hai!");
  if (member.currentBooksIssued >= member.maxBooksAllowed) {
    throw new Error(`Member ki limit reach ho gayi hai! (${member.currentBooksIssued}/${member.maxBooksAllowed})`);
  }

  // Check if same book already issued to this member
  const alreadyIssued = await prisma.bookIssue.findFirst({
    where: { bookId, memberId, status: "ISSUED", tenantId, isDeleted: false },
  });
  if (alreadyIssued) throw new Error("Ye book already is member ko issue hai!");

  // Due date calculate karo
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + settings.issueDurationDays);

  // Transaction use karo — atomicity ke liye
  const issue = await prisma.$transaction(async (tx) => {
    // Book issue record create karo
    const newIssue = await tx.bookIssue.create({
      data: {
        bookId,
        memberId,
        memberType: member.memberType,
        dueDate,
        issuedBy,
        remarks,
        tenantId,
      },
      include: {
        book: { select: { title: true, author: true } },
        member: { select: { name: true, membershipId: true } },
      },
    });

    // Book ki available copies decrease karo
    await tx.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    });

    // Member ki current issued books increment karo
    await tx.libraryMember.update({
      where: { id: memberId },
      data: { currentBooksIssued: { increment: 1 } },
    });

    return newIssue;
  });

  console.log("✅ Book successfully issue ho gayi! Issue ID:", issue.id);
  return issue;
};

// Book return karo — fine auto-calculate hoga
export const returnBook = async (tenantId: string, input: ReturnBookInput) => {
  const { issueId, returnedBy, fineStatus, remarks } = input;
  console.log("📥 Book return ho rahi hai — Issue ID:", issueId);

  // Issue record fetch karo
  const issue = await prisma.bookIssue.findFirst({
    where: { id: issueId, tenantId, isDeleted: false },
    include: { book: true, member: true },
  });

  if (!issue) throw new Error("Issue record not found!");
  if (issue.status === "RETURNED") throw new Error("Ye book already return ho chuki hai!");

  // Fine calculate karo agar overdue hai
  const settings = await getLibrarySettings(tenantId);
  const today = new Date();
  let fineAmount = 0;

  if (today > issue.dueDate) {
    const diffTime = today.getTime() - issue.dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fineAmount = diffDays * settings.finePerDay;
    console.log(`⚠️ Fine lagegi: ${diffDays} din late × ₹${settings.finePerDay} = ₹${fineAmount}`);
  }

  // Transaction use karo
  const returnedIssue = await prisma.$transaction(async (tx) => {
    // Issue record update karo
    const updated = await tx.bookIssue.update({
      where: { id: issueId },
      data: {
        returnDate: today,
        status: "RETURNED",
        fineAmount,
        fineStatus: fineAmount > 0 ? (fineStatus || "PENDING") : null,
        returnedBy,
        remarks,
      },
      include: {
        book: { select: { title: true, author: true } },
        member: { select: { name: true, membershipId: true } },
      },
    });

    // Book ki available copies wapas badhao
    await tx.book.update({
      where: { id: issue.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    // Member ki issued count decrease karo
    await tx.libraryMember.update({
      where: { id: issue.memberId },
      data: { currentBooksIssued: { decrement: 1 } },
    });

    return updated;
  });

  console.log("✅ Book successfully return ho gayi!");
  return returnedIssue;
};

// Book renew karo — due date extend hogi
export const renewBook = async (tenantId: string, issueId: string) => {
  console.log("🔄 Book renew ho rahi hai — Issue ID:", issueId);

  const settings = await getLibrarySettings(tenantId);
  if (!settings.allowRenewal) throw new Error("Renewal allowed nahi hai library settings mein!");

  const issue = await prisma.bookIssue.findFirst({
    where: { id: issueId, tenantId, status: "ISSUED", isDeleted: false },
  });

  if (!issue) throw new Error("Active issue record nahi mila!");

  // Check renewal count (remarks mein track karte hain)
  const renewalCount = issue.remarks?.match(/\[RENEWED:/g)?.length || 0;
  if (renewalCount >= settings.maxRenewals) {
    throw new Error(`Maximum renewals (${settings.maxRenewals}) ho chuki hain!`);
  }

  // Due date extend karo
  const newDueDate = new Date(issue.dueDate);
  newDueDate.setDate(newDueDate.getDate() + settings.issueDurationDays);

  const updated = await prisma.bookIssue.update({
    where: { id: issueId },
    data: {
      dueDate: newDueDate,
      remarks: `${issue.remarks || ""} [RENEWED: ${new Date().toISOString().split("T")[0]}]`.trim(),
    },
    include: {
      book: { select: { title: true, author: true } },
      member: { select: { name: true, membershipId: true } },
    },
  });

  console.log("✅ Book renew ho gayi! New due date:", newDueDate);
  return updated;
};

// ==================== OVERDUE ====================
// Saari overdue books fetch karo aur fine calculate karo
export const getOverdueBooks = async (tenantId: string) => {
  console.log("⚠️ Overdue books check ho rahi hain...");

  const settings = await getLibrarySettings(tenantId);

  const overdueIssues = await prisma.bookIssue.findMany({
    where: {
      tenantId,
      isDeleted: false,
      status: "ISSUED",
      dueDate: { lt: new Date() },
    },
    include: {
      book: { select: { title: true, author: true } },
      member: { select: { name: true, membershipId: true, memberType: true, phone: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Fine calculate karo each overdue ke liye
  const today = new Date();
  const overdueWithFine = overdueIssues.map((issue) => {
    const diffTime = today.getTime() - issue.dueDate.getTime();
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fineAmount = overdueDays * settings.finePerDay;

    return {
      ...issue,
      overdueDays,
      calculatedFine: fineAmount,
    };
  });

  return overdueWithFine;
};

// ==================== MEMBER HISTORY ====================
// Ek member ki puri history dikhao
export const getMemberHistory = async (tenantId: string, memberId: string) => {
  console.log("📜 Member history fetch ho rahi hai:", memberId);

  const member = await prisma.libraryMember.findFirst({
    where: { id: memberId, tenantId, isDeleted: false },
  });

  if (!member) throw new Error("Member not found!");

  const issues = await prisma.bookIssue.findMany({
    where: { memberId, tenantId, isDeleted: false },
    include: {
      book: { select: { title: true, author: true, category: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    totalBooksRead: issues.filter((i) => i.status === "RETURNED").length,
    currentlyIssued: issues.filter((i) => i.status === "ISSUED").length,
    totalFine: issues.reduce((sum, i) => sum + i.fineAmount, 0),
    paidFine: issues.filter((i) => i.fineStatus === "PAID").reduce((sum, i) => sum + i.fineAmount, 0),
  };

  return { member, issues, stats };
};

// ==================== REPORTS ====================
// Most issued books — popular books dikhao
export const getMostIssuedBooks = async (tenantId: string, limit: number = 10) => {
  console.log("📊 Most issued books report generate ho raha hai");

  const issues = await prisma.bookIssue.groupBy({
    by: ["bookId"],
    where: { tenantId, isDeleted: false },
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit,
  });

  // Book details fetch karo
  const bookIds = issues.map((i) => i.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true, category: { select: { name: true } } },
  });

  const result = issues.map((issue) => {
    const book = books.find((b) => b.id === issue.bookId);
    return {
      bookId: issue.bookId,
      title: book?.title || "Unknown",
      author: book?.author || "Unknown",
      category: book?.category?.name || "Unknown",
      issueCount: issue._count.bookId,
    };
  });

  return result;
};

// Category-wise statistics
export const getCategoryStats = async (tenantId: string) => {
  console.log("📊 Category-wise stats generate ho rahe hain");

  const categories = await prisma.bookCategory.findMany({
    where: { tenantId, isDeleted: false },
    include: {
      books: {
        where: { isDeleted: false },
        select: {
          id: true,
          totalCopies: true,
          availableCopies: true,
          _count: { select: { issues: true } },
        },
      },
    },
  });

  const stats = categories.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    totalBooks: cat.books.length,
    totalCopies: cat.books.reduce((sum, b) => sum + b.totalCopies, 0),
    availableCopies: cat.books.reduce((sum, b) => sum + b.availableCopies, 0),
    totalIssues: cat.books.reduce((sum, b) => sum + b._count.issues, 0),
  }));

  return stats;
};

// ==================== SETTINGS ====================
// Library settings fetch karo — agar nahi hain toh default create karo
export const getLibrarySettings = async (tenantId: string) => {
  console.log("⚙️ Library settings fetch ho rahi hain");

  let settings = await prisma.librarySetting.findUnique({
    where: { tenantId },
  });

  // Agar settings nahi hain toh default banao
  if (!settings) {
    settings = await prisma.librarySetting.create({
      data: {
        tenantId,
        maxBooksPerStudent: 3,
        maxBooksPerTeacher: 5,
        maxBooksPerStaff: 3,
        issueDurationDays: 14,
        finePerDay: 2,
        allowRenewal: true,
        maxRenewals: 2,
        lostBookFineMultiplier: 2,
        workingDaysOnly: false,
      },
    });
  }

  return settings;
};

// Library settings update karo
export const updateLibrarySettings = async (tenantId: string, data: any) => {
  console.log("⚙️ Library settings update ho rahi hain");

  // Pehle ensure karo ki settings exist kare
  await getLibrarySettings(tenantId);

  const settings = await prisma.librarySetting.update({
    where: { tenantId },
    data,
  });

  return settings;
};

// ==================== SEARCH ====================
// Universal search — books search karo (title, author, isbn)
export const searchBooks = async (tenantId: string, query: string, limit: number = 20) => {
  console.log("🔍 Books search ho rahi hai:", query);

  if (!query || query.length < 2) return [];

  const books = await prisma.book.findMany({
    where: {
      tenantId,
      isDeleted: false,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { author: { contains: query, mode: "insensitive" } },
        { isbn: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { category: { select: { name: true } } },
    take: limit,
  });

  return books;
};

// Member search — member dhundho by name, email, membershipId
export const searchMembers = async (tenantId: string, query: string, limit: number = 20) => {
  console.log("🔍 Members search ho rahe hain:", query);

  if (!query || query.length < 2) return [];

  const members = await prisma.libraryMember.findMany({
    where: {
      tenantId,
      isDeleted: false,
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { membershipId: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
  });

  return members;
};

// Issue search — by member ke issued books dhundho
export const getActiveIssuesByMember = async (tenantId: string, memberId: string) => {
  const issues = await prisma.bookIssue.findMany({
    where: { memberId, tenantId, status: "ISSUED", isDeleted: false },
    include: {
      book: { select: { title: true, author: true } },
      member: { select: { name: true, membershipId: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return issues;
};

// Mark book as lost
export const markBookLost = async (tenantId: string, issueId: string, returnedBy: string) => {
  console.log("❌ Book lost mark ho rahi hai:", issueId);

  const issue = await prisma.bookIssue.findFirst({
    where: { id: issueId, tenantId, status: "ISSUED", isDeleted: false },
    include: { book: true },
  });

  if (!issue) throw new Error("Issue record not found!");

  const settings = await getLibrarySettings(tenantId);
  const fineAmount = (issue.book.price || 500) * settings.lostBookFineMultiplier;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedIssue = await tx.bookIssue.update({
      where: { id: issueId },
      data: {
        status: "LOST",
        fineAmount,
        fineStatus: "PENDING",
        returnedBy,
        returnDate: new Date(),
      },
      include: {
        book: { select: { title: true, author: true } },
        member: { select: { name: true, membershipId: true } },
      },
    });

    // Total copies reduce karo
    await tx.book.update({
      where: { id: issue.bookId },
      data: { totalCopies: { decrement: 1 } },
    });

    // Member ki count decrement karo
    await tx.libraryMember.update({
      where: { id: issue.memberId },
      data: { currentBooksIssued: { decrement: 1 } },
    });

    return updatedIssue;
  });

  return updated;
};

